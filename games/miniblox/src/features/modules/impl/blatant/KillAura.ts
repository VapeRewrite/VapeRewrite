import type { EntityLivingBase, World } from "@wq2/miniblox-sdk";

import { Category, SimpleVec3 } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { deg2rad } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import calculateRotations from "@/utils/aiming/lookAt";
import RotationManager, { RotationPlan } from "@/utils/aiming/rotate";
import { SETTING } from "@/utils/movement/MovementCorrection";
import { findTargets } from "@/utils/movement/target";
import { stampTarget } from "@/utils/movement/TargetTracker";
import PacketRefs from "@/utils/network/packetRefs";
import Miniblox from "@/utils/refs/miniblox";

export default class KillAura extends Mod {
	name = "KillAura";
	category = Category.BLATANT;
	// private attackDelay = Date.now();
	#blocking = false;

	// Settings
	#rangeSetting = this.createSliderSetting("Range", 6, 3, 10, 0.5);
	#angleSetting = this.createSliderSetting("Angle", 360, 1, 360, 1);
	#autoBlockSetting = this.createToggleSetting("Auto Block", true);
	#wallCheckSetting = this.createToggleSetting("Wall Check", false);
	#movementCorrectionSetting = this.createDropdownSetting("Movement Correction", SETTING);

	get #movementCorrection() {
		return this.#movementCorrectionSetting.value();
	}

	get #range() {
		return this.#rangeSetting.value();
	}

	get #angle() {
		return this.#angleSetting.value();
	}

	get #autoBlock() {
		return this.#autoBlockSetting.value();
	}

	get #wallCheck() {
		return this.#wallCheckSetting.value();
	}

	#block() {
		if (!this.#autoBlock) {
			this.#blocking = false;
			return;
		}
		if (this.#blocking) return;
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
		this.#blocking = true;
	}

	#unblock() {
		if (!this.#blocking) return;
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
		this.#blocking = false;
	}

	#sendAttack(e: EntityLivingBase) {
		const { ClientSocket, player } = Miniblox;
		const box = e.getEntityBoundingBox();
		const hitVec = player.getEyePos().clone().clamp(box.min, box.max);

		stampTarget(e);

		const rots = calculateRotations(
			SimpleVec3.fromThreeVec3(player.getEyePos()),
			SimpleVec3.fromThreeVec3(e.pos),
		);
		const diffYaw = player.newYaw - rots.yaw;

		if (Math.abs(diffYaw) < deg2rad(this.#angle)) {
			RotationManager.scheduleRotation(new RotationPlan(rots, this.#movementCorrection.value, 1));
		}

		const { SPacketUseEntity } = PacketRefs.s;
		if (SPacketUseEntity === undefined) {
			// in case you haven't attacked yet
			const [oldYaw, oldPitch] = [player.yaw, player.pitch];
			const {
				playerController: pc,
				playerController: { objectMouseOver },
			} = Miniblox;
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
		const targets = findTargets(this.#range, this.#angle, this.#wallCheck);
		this.#block();
		for (const target of targets) {
			this.#sendAttack(target);
		}
		this.#unblock();
	}
}
