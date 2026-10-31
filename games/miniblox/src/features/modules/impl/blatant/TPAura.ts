import type { EntityLivingBase, World } from "@wq2/miniblox-sdk";

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { deg2rad } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import RotationManager, { RotationPlan } from "@/utils/aiming/rotate";
import Rotation from "@/utils/aiming/rotation";
import MovementCorrection from "@/utils/movement/MovementCorrection";
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

/** max offset you can be looking away from a player in degrees */
const MAX_OFFSET_DEG = 30;
/** max offset you can be looking away from a player in radians */
const MAX_OFFSET_RAD = deg2rad(MAX_OFFSET_DEG);

/** max distance you can attack a player from */
const MAX_DIST = 6;

/** max distance squared */
const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

export default class TPAura extends Mod {
	public name = "TPAura";
	public category = Category.BLATANT;
	private blocking = false;

	// Settings
	#rangeSetting = this.createSliderSetting("Range", 20, 6, 48, 0.5);
	#autoBlockSetting = this.createToggleSetting("Auto Block", true);
	#tpBackSetting = this.createToggleSetting("TP back", false);


	get #range() {
		return this.#rangeSetting.value();
	}

	get #autoBlock() {
		return this.#autoBlockSetting.value();
	}
	get #tpBack() {
		return this.#tpBackSetting.value();
	}

	#block() {
		if (!this.#autoBlock) {
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

	#unblock() {
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

	#sendAttack(e: EntityLivingBase) {
		const { ClientSocket, player } = Miniblox;
		const box = e.getEntityBoundingBox();
		const hitVec = player.getEyePos().clone().clamp(box.min, box.max);

		stampTarget(e);

		const aimPos = player.pos.clone().sub(e.pos);
		const newYaw = wrapAngleTo180_radians(Math.atan2(aimPos.x, aimPos.z) - player.lastReportedYaw);
		const checkYaw = wrapAngleTo180_radians(Math.atan2(aimPos.x, aimPos.z) - player.yaw);
		const outOfRange = player.getDistanceSqToEntity(e) > MAX_DIST_SQ;

		const SPacketPlayerPosLook = outOfRange ? PacketRefs.s.SPacketPlayerPosLook : undefined;
		const needsRots = Math.abs(checkYaw) > MAX_OFFSET_RAD;
		const rots = needsRots
			? new Rotation(player.lastReportedYaw + newYaw, RotationManager.activeRotation.pitch)
			: RotationManager.activeRotation;
		if (outOfRange) {
			ClientSocket.sendPacket(
				new SPacketPlayerPosLook({
					onGround: player.onGround,
					pos: e.pos,
					yaw: rots.yaw,
					pitch: rots.pitch,
				}),
			);
		}

		if (needsRots) {
			RotationManager.scheduleRotation(new RotationPlan(rots, MovementCorrection.None, 1));
		}

		const { SPacketUseEntity } = PacketRefs.s;
		if (SPacketUseEntity === undefined) {
			// in case you haven't attacked yet
			const [oldYaw, oldPitch] = [player.yaw, player.pitch];
			const oldHitVec = Miniblox.playerController.objectMouseOver.hitVec;
			player.yaw = RotationManager.activeRotation.yaw;
			player.pitch = RotationManager.activeRotation.pitch;
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
					yaw: RotationManager.activeRotation.yaw,
					pitch: RotationManager.activeRotation.pitch,
					sequence: player.inputSequenceNumber,
				}),
			);
			player.attack(e);
		}
		if (outOfRange && this.#tpBack)
			ClientSocket.sendPacket(
				new SPacketPlayerPosLook({
					onGround: player.onGround,
					pos: player.pos,
					yaw: player.yaw,
					pitch: player.pitch,
				}),
			);
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
