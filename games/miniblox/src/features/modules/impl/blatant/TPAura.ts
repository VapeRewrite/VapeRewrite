import type { EntityLivingBase, World } from "@wq2/miniblox-sdk";
import type { Vector3Like } from "three";

import { Category, SimpleVec3, type ArrayVec2 } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import calculateRotations from "@/utils/aiming/lookAt";
import RotationManager, { RotationPlan } from "@/utils/aiming/rotate";
import MovementCorrection from "@/utils/movement/MovementCorrection";
import { findTargets } from "@/utils/movement/target";
import { stampTarget } from "@/utils/movement/TargetTracker";
import PacketRefs from "@/utils/network/packetRefs";
import Miniblox from "@/utils/refs/miniblox";

/** max distance you can attack a player from */
const MAX_DIST = 3.5;

/** max distance squared */
const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

export default class TPAura extends Mod {
	name = "TPAura";
	category = Category.BLATANT;
	#blocking = false;

	// Settings
	#rangeSetting = this.createSliderSetting("Range", 20, 6, 48, 0.5);
	#autoBlockSetting = this.createToggleSetting("Auto Block", true);
	#tpBackSetting = this.createToggleSetting("TP back", false);
	#tpModeSetting = this.createDropdownSetting("TP mode", ["Packet", "Move"]);

	get #range() {
		return this.#rangeSetting.value();
	}

	get #autoBlock() {
		return this.#autoBlockSetting.value();
	}
	get #tpBack() {
		return this.#tpBackSetting.value();
	}

	get #tpMode() {
		return this.#tpModeSetting.value();
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

	#tp(pos: Vector3Like, [yaw, pitch]: ArrayVec2) {
		switch (this.#tpMode) {
			case "Packet": {
				const { ClientSocket, player } = Miniblox;
				const SPacketPlayerPosLook = PacketRefs.s.SPacketPlayerPosLook;
				ClientSocket.sendPacket(
					new SPacketPlayerPosLook({
						onGround: player.onGround,
						pos,
						yaw,
						pitch,
					}),
				);
				return;
			}
			case "Move": {
				const { ClientSocket, player } = Miniblox;
				const SPacketPlayerPosLook = PacketRefs.s.SPacketPlayerPosLook;
				if (SPacketPlayerPosLook)
					ClientSocket.sendPacket(
						new SPacketPlayerPosLook({
							onGround: player.onGround,
							pos,
							yaw,
							pitch,
						}),
					);
				const { x, y, z } = pos;
				player.setPositionAndRotation(x, y, z, yaw, pitch);
				return;
			}
		}
	}

	#sendAttack(e: EntityLivingBase) {
		const { ClientSocket, player } = Miniblox;
		const box = e.getEntityBoundingBox();
		const hitVec = player.getEyePos().clone().clamp(box.min, box.max);

		stampTarget(e);

		const pos = e.pos.clone().setY(e.pos.y + e.getEyeHeight());

		const outOfRange = player.getDistanceSqToEntity(e) > MAX_DIST_SQ;

		const rots = calculateRotations(
			SimpleVec3.fromThreeVec3(player.getEyePos()),
			SimpleVec3.fromThreeVec3(pos),
		);
		if (outOfRange) this.#tp(pos, rots.toAV2());

		RotationManager.scheduleRotation(new RotationPlan(rots, MovementCorrection.None, 2));

		const { SPacketUseEntity } = PacketRefs.s;
		if (SPacketUseEntity === undefined) {
			// in case you haven't attacked yet
			const [oldYaw, oldPitch] = [player.yaw, player.pitch];
			const oldHitVec = Miniblox.playerController.objectMouseOver.hitVec;
			player.yaw = rots.yaw;
			player.pitch = rots.pitch;
			Miniblox.playerController.objectMouseOver.hitVec = hitVec;
			Miniblox.playerController.attackEntity(e);
			Miniblox.playerController.objectMouseOver.hitVec = oldHitVec;
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
		if (outOfRange && this.#tpBack) {
			const { yaw, pitch } = player;
			this.#tp(player.pos, [yaw, pitch]);
		}
	}

	@Subscribe("playerTick")
	private onTick() {
		// ghetto ahh method
		const targets = findTargets(this.#range);
		if (targets.length === 0) return;
		this.#block();
		this.#sendAttack(targets[0]);
		this.#unblock();
	}
}
