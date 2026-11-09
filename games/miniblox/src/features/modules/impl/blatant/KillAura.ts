import type { EntityLivingBase, World } from "@wq2/miniblox-sdk";

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { deg2rad } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import RotationManager, { RotationPlan } from "@/utils/aiming/rotate";
import Rotation from "@/utils/aiming/rotation";
import { SETTING } from "@/utils/movement/MovementCorrection";
import { findTargets } from "@/utils/movement/target";
import { stampTarget } from "@/utils/movement/TargetTracker";
import PacketRefs from "@/utils/network/packetRefs";
import Miniblox from "@/utils/refs/miniblox";

function wrapAngleTo180_radians(angle: number): number {
	let ang = angle;
	ang = ang % (Math.PI * 2);
	if (ang >= Math.PI) {
		ang -= Math.PI * 2;
	}
	if (ang < -Math.PI) {
		ang += Math.PI * 2;
	}
	return ang;
}

export default class KillAura extends Mod {
	public name = "KillAura";
	public category = Category.BLATANT;
	// private attackDelay = Date.now();
	private blocking = false;

	// Settings
	private rangeSetting = this.createSliderSetting("Range", 6, 3, 10, 0.5);
	private angleSetting = this.createSliderSetting("Angle", 360, 1, 360, 1);
	private autoBlockSetting = this.createToggleSetting("Auto Block", true);
	private wallCheckSetting = this.createToggleSetting("Wall Check", false);
	private movementCorrectionSetting = this.createDropdownSetting("Movement Correction", SETTING);

	get movementCorrection() {
		return this.movementCorrectionSetting.value();
	}

	get range() {
		return this.rangeSetting.value();
	}

	get angle() {
		return this.angleSetting.value();
	}

	get autoBlock() {
		return this.autoBlockSetting.value();
	}

	get wallCheck() {
		return this.wallCheckSetting.value();
	}

	block() {
		if (!this.autoBlock) {
			this.blocking = false;
			return;
		}
		if (this.blocking) return;
		const { ClientSocket, playerControllerMP, player, world, playerController } = Miniblox;
		// auto-remapping proxy!
		playerControllerMP.syncItem();
		const { SPacketUseItem } = PacketRefs.s;
		if (SPacketUseItem) {
			ClientSocket.sendPacket(
				new PacketRefs.s.SPacketUseItem({
					initialPress: true,
					button: "right",
					hand: 0, // MAIN_HAND
				}),
			);
		} else {
			playerController.sendUseItem(player, world as unknown as World, player.getHeldItem());
		}
		this.blocking = true;
	}

	unblock() {
		if (!this.blocking) return;
		const { ClientSocket, BlockPos, EnumFacing, player, playerControllerMP, playerController } =
			Miniblox;
		// auto-remapping proxy again lol
		playerControllerMP.syncItem();
		const { SPacketPlayerAction } = PacketRefs.s;
		if (!SPacketPlayerAction) {
			playerController.onStoppedUsingItem(player);
		} else {
			ClientSocket.sendPacket(
				new PacketRefs.s.SPacketPlayerAction({
					position: BlockPos.ORIGIN.toProto(),
					facing: EnumFacing.DOWN.getIndex(),
					action: 5, // PBAction.RELEASE_USE_ITEM
				}),
			);
		}
		this.blocking = false;
	}

	sendAttack(e: EntityLivingBase, first: boolean) {
		const { ClientSocket, player } = Miniblox;
		const box = e.getEntityBoundingBox();
		const hitVec = player.getEyePos().clone().clamp(box.min, box.max);

		stampTarget(e);

		const aimPos = player.pos.clone().sub(e.pos);
		const newYaw = wrapAngleTo180_radians(Math.atan2(aimPos.x, aimPos.z) - player.lastReportedYaw);
		const checkYaw = wrapAngleTo180_radians(Math.atan2(aimPos.x, aimPos.z) - player.yaw);

		// screw math, this pitch calculation is catgpt.
		const horizontalDist = Math.sqrt(
			aimPos.x * aimPos.x + aimPos.z * aimPos.z
		);

		const targetPitch = Math.atan2(aimPos.y, horizontalDist);

		const playerPitchRadians = player.pitch * (Math.PI / 2);

		const newPitch = (targetPitch - playerPitchRadians) / (Math.PI / 2);

		const rots = new Rotation(player.lastReportedYaw + newYaw, newPitch);

		if (Math.abs(checkYaw) < deg2rad(this.angle)) {
			RotationManager.scheduleRotation(
				new RotationPlan(
					rots,
					this.movementCorrection.value,
					1,
				),
			);
		}

		const { SPacketUseEntity } = PacketRefs.s;
		if (SPacketUseEntity === undefined) {
			// in case you haven't attacked yet
			const [oldYaw, oldPitch] = [player.yaw, player.pitch];
			const {playerController: pc, playerController: {objectMouseOver}} = Miniblox;
			const oldHitVec = objectMouseOver.hitVec;
			player.yaw = rots.yaw;
			player.pitch = rots.pitch;
			objectMouseOver.hitVec = hitVec;
			pc.attackEntity(e);
			objectMouseOver.hitVec = oldHitVec;
			player.yaw = oldYaw;
			player.pitch = oldPitch;
		} else {
			ClientSocket.sendPacket(
				new SPacketUseEntity({
					id: e.id,
					action: 1,
					hitVec: {
						x: hitVec.x,
						y: hitVec.y,
						z: hitVec.z,
					},
					//@ts-expect-error: it's new
					yaw: rots.yaw,
					pitch: rots.pitch,
					sequence: player.inputSequenceNumber,
				}),
			);
			player.attack(e);
		}
	}

	@Subscribe("playerTick")
	onTick() {
		// ghetto ahh method
		let first = true;
		const targets = findTargets(this.range, this.angle, this.wallCheck);
		this.block();
		for (const target of targets) {
			this.sendAttack(target, first);
			first = false;
		}
		this.unblock();
	}
}
