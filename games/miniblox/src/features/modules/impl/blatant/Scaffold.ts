import type { BlockPos, EnumFacing } from "@wq2/miniblox-sdk";
import type { Vector3 } from "three";

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import RotationManager, { RotationPlan } from "@/utils/aiming/rotate";
import Rotation from "@/utils/aiming/rotation";
import isKeyDown from "@/utils/input/key";
import { SETTING } from "@/utils/movement/MovementCorrection";
import Miniblox from "@/utils/refs/miniblox";
import THREE from "@/utils/refs/three";

export default class Scaffold extends Mod {
	public name = "Scaffold";
	public category = Category.BLATANT;

	// Settings
	private towerSetting = this.createToggleSetting("Tower", true);
	private expandSetting = this.createSliderSetting("Expand", 1, 0, 5, 0.5);
	private cycleSetting = this.createSliderSetting("Cycle Speed", 10, 0, 20, 1);
	private placesPerTickSetting = this.createSliderSetting("Places Per Tick", 10, 0, 20, 1);
	private keepYSetting = this.createToggleSetting("Keep Y", false);
	private techniqueSetting = this.createDropdownSetting("Technique", ["Normal", "Telly"]);
	private movementCorrectionSetting = this.createDropdownSetting(
		"Movement Correction",
		SETTING,
		undefined,
		() => this.rotationMode !== "Off",
	);
	private rotationModeSetting = this.createDropdownSetting("Rotation mode", ["Off", "Normal"]);
	private blockTargetModeSetting = this.createDropdownSetting("Block target mode", [
		"Air Place",
		"Clutch",
	]);
	private clutchModeSetting = this.createDropdownSetting("Clutch mode", ["Air Place", "Clutch"]);

	private autoJumpSetting = this.createToggleSetting("Auto Jump", false);
	private autoJumpOnlySprintSetting = this.createToggleSetting(
		"Jump only when sprinting",
		false,
		() => this.autoJump,
	);

	// State
	private oldHeldSlot?: number;
	private tickCount = 0;
	private lastScaffoldY: number | null = null;

	get tower() {
		return this.towerSetting.value();
	}

	get expand() {
		return this.expandSetting.value();
	}

	get cycleSpeed() {
		return this.cycleSetting.value();
	}

	get placesPerTick() {
		return this.placesPerTickSetting.value();
	}

	get keepY() {
		return this.keepYSetting.value();
	}

	get technique() {
		return this.techniqueSetting.value();
	}

	get rotationMode() {
		return this.rotationModeSetting.value();
	}

	get blockTargetMode() {
		return this.blockTargetModeSetting.value();
	}
	get movementCorrection() {
		return this.movementCorrectionSetting.value();
	}

	get clutchMode() {
		return this.clutchModeSetting.value();
	}

	get autoJump() {
		return this.autoJumpSetting.value();
	}
	get autoJumpOnlySprint() {
		return this.autoJumpOnlySprintSetting.value();
	}

	protected onEnable(): void {
		const game = Miniblox.game;
		if (game) {
			this.oldHeldSlot = game.info.selectedSlot;
		}
		this.tickCount = 0;
		this.lastScaffoldY = null;
	}

	protected onDisable(): void {
		this.lastScaffoldY = null;
		if (Miniblox.game && this.oldHeldSlot !== undefined) {
			this.switchSlot(this.oldHeldSlot);
		}
	}

	private switchSlot(slot: number): void {
		if (!Miniblox.game) return;
		const { player, game } = Miniblox;
		player.inventory.currentItem = slot;
		game.info.selectedSlot = slot;
	}

	private findBlockSlots(): number[] {
		const { player, ItemBlock } = Miniblox;
		if (!player || !ItemBlock) return [];

		const slotsWithBlocks: number[] = [];

		for (let i = 0; i < 9; i++) {
			// TODO: support offhand (I'm lazy)
			const stack = player.inventory.main[i];
			if (!stack) continue;
			const { item } = stack;
			if (!(item instanceof ItemBlock)) continue;
			const { block } = item;
			if (block.getBoundingBox().max.y === 1 && stack.item.name !== "tnt") {
				slotsWithBlocks.push(i);
			}
		}
		return slotsWithBlocks;
	}

	private getPossibleSides(pos: BlockPos): EnumFacing | null {
		const { player } = Miniblox;
		if (
			this.blockTargetMode === "Air Place" &&
			this.clutchMode === "Air Place" &&
			pos.y <= Math.floor(player.pos.y)
		) {
			return player.getHorizontalFacing();
		}

		const { BlockPos, EnumFacing, game, Materials } = Miniblox;
		if (!BlockPos) return null;
		if (!Materials) return null;
		for (const side of EnumFacing.VALUES) {
			const offset = side.toVector();
			const checkPos = new BlockPos(pos.x + offset.x, pos.y + offset.y, pos.z + offset.z);
			const state = game.world.getBlockState(checkPos);
			if (state.getBlock().material !== Materials.air) {
				return side.getOpposite();
			}
		}
		return null;
	}

	private getRandomHitVec(placePos: BlockPos, face: EnumFacing): Vector3 {
		const { EnumFacing } = Miniblox;
		const { Vec3 } = THREE;
		const rand = () => 0.2 + Math.random() * 0.6;
		let hitX = placePos.x + 0.5;
		let hitY = placePos.y + 0.5;
		let hitZ = placePos.z + 0.5;

		const { name: axis } = face.getAxis();

		if (axis === "y") {
			hitX = placePos.x + rand();
			hitY = placePos.y + (face === EnumFacing.UP ? 0.99 : 0.01);
			hitZ = placePos.z + rand();
		} else if (axis === "x") {
			hitX = placePos.x + (face === EnumFacing.EAST ? 0.99 : 0.01);
			hitY = placePos.y + rand();
			hitZ = placePos.z + rand();
		} else {
			hitX = placePos.x + rand();
			hitY = placePos.y + rand();
			hitZ = placePos.z + (face === EnumFacing.SOUTH ? 0.99 : 0.01);
		}

		return new Vec3(hitX, hitY, hitZ);
	}

	private applyRotation(placePos: BlockPos): void {
		const { player } = Miniblox;
		if (this.rotationMode === "Off") return;

		const dx = placePos.x + 0.5 - player.pos.x;
		const dy = placePos.y + 0.5 - (player.pos.y + player.getEyeHeight());
		const dz = placePos.z + 0.5 - player.pos.z;
		const dist = Math.sqrt(dx * dx + dz * dz);

		const RAD2DEG = 180 / Math.PI;

		RotationManager.scheduleRotation(
			new RotationPlan(
				new Rotation(Math.atan2(dz, dx) * RAD2DEG - 90, -(Math.atan2(dy, dist) * RAD2DEG)),
				this.movementCorrection.value,
			),
		);
	}

	@Subscribe("playerTick")
	onTick(): void {
		const { player, game, BlockPos, ItemBlock, playerController } = Miniblox;

		if (this.technique === "Telly" && player.onGround && player.isSprinting()) {
			player.jump();
		} else if (
			this.autoJump &&
			player.onGround &&
			(!this.autoJumpOnlySprint || player.isSprinting())
		) {
			player.jump();
		}

		this.tickCount++;

		// Auto-select blocks & cycle
		const blockSlots = this.findBlockSlots();
		if (blockSlots.length === 0) return;

		if (blockSlots.length >= 2 && this.cycleSpeed > 0) {
			const selected = Math.floor(this.tickCount / this.cycleSpeed) % blockSlots.length;
			this.switchSlot(blockSlots[selected]);
		} else {
			this.switchSlot(blockSlots[0]);
		}

		const item = player.inventory.getCurrentItem();
		if (!item || !(item.getItem() instanceof ItemBlock)) return;
		const isMoving = player.moveForward !== 0 || player.moveStrafe !== 0;
		const playerX = Math.floor(player.pos.x);
		const playerY = Math.floor(player.pos.y);
		const playerZ = Math.floor(player.pos.z);

		let targetY: number;
		if (this.keepY) {
			if (this.lastScaffoldY === null) {
				this.lastScaffoldY = playerY - 1;
			}

			if (isMoving && player.jumping) {
				targetY = this.lastScaffoldY + 1;
			} else {
				targetY = this.lastScaffoldY;
			}
		} else {
			targetY = playerY - 1;
			this.lastScaffoldY = targetY;
		}

		// Predict future position
		const predictionMultiplier = this.expand * 2;
		const futureX = player.pos.x + player.motion.x * predictionMultiplier;
		const futureZ = player.pos.z + player.motion.z * predictionMultiplier;
		const flooredFutureX = Math.floor(futureX);
		const flooredFutureZ = Math.floor(futureZ);

		// Check positions
		const positionsToCheck = [
			new BlockPos(flooredFutureX, targetY, flooredFutureZ),
			new BlockPos(playerX, targetY, playerZ),
		];

		// Add diagonal positions for fast strafing
		if (Math.abs(player.motion.x) > 0.1 || Math.abs(player.motion.z) > 0.1) {
			positionsToCheck.push(
				new BlockPos(flooredFutureX, targetY, playerZ),
				new BlockPos(playerX, targetY, flooredFutureZ),
			);
		}

		// TODO: we need hud3D
		const { Materials } = Miniblox;
		let places = 0;

		for (const pos of positionsToCheck) {
			const blockAtPos = game.world.getBlockState(pos).getBlock();

			// Skip if not air
			if (!Materials || blockAtPos.material !== Materials.air) continue;

			// Find a side to place on
			let placeSide = this.getPossibleSides(pos);

			// If no direct side, search nearby unless clutch-only target mode
			if (!placeSide && this.blockTargetMode !== "Clutch") {
				let found = false;
				for (let dist = 1; dist <= 2 && !found; dist++) {
					for (let x = -dist; x <= dist && !found; x++) {
						for (let z = -dist; z <= dist && !found; z++) {
							if (x === 0 && z === 0) continue;
							const searchPos = new BlockPos(pos.x + x, pos.y, pos.z + z);
							const side = this.getPossibleSides(searchPos);
							if (side) {
								placeSide = side;
								found = true;
								break;
							}
						}
					}
				}
			}

			if (!placeSide) {
				if (this.technique === "Normal") {
					this.applyRotation(pos);
				}
				continue;
			}

			// Calculate place position
			const dir = placeSide.getOpposite().toVector();
			const placePos = new BlockPos(pos.x + dir.x, pos.y + dir.y, pos.z + dir.z);

			if (this.technique === "Normal" || (this.technique === "Telly" && !player.onGround)) {
				this.applyRotation(placePos);
			}

			// Calculate hit vector
			const hitVec = this.getRandomHitVec(placePos, placeSide);

			// Tower mode
			if (this.tower && isKeyDown("Space") && player.onGround) {
				const centerDist = Math.sqrt(
					(player.pos.x - (playerX + 0.5)) ** 2 + (player.pos.z - (playerZ + 0.5)) ** 2,
				);

				if (centerDist < 0.3 && player.motion.y < 0.2 && player.motion.y >= 0) {
					player.motion.y = 0.42;
				}
			}

			const hand = playerController.resolveUseHand();
			// Try to place block
			if (
				playerController.onPlayerRightClick(
					player,
					//@ts-expect-error: son
					game.world,
					item,
					placePos,
					placeSide,
					hitVec,
					hand,
				)
			) {
				//hud3D.swingArm();
				playerController.swingHand(hand);

				// Handle item stack
				if (item.stackSize === 0) {
					player.inventory.main[player.inventory.currentItem] = null;
				}
			}

			if (places++ > this.placesPerTick) break;
		}
	}
}
