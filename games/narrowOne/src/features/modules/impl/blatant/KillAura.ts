import Bus from "@/Bus";
import { lookAtPlayer } from "@/utils/aiming/lookAt";
import RotationManager, { RotationPlan } from "@/utils/aiming/rotate";
import canAttack from "@/utils/combat/teams";
import game from "@/utils/refs/game";
import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

export default class KillAura extends Mod {
	name = "KillAura";
	category = Category.BLATANT;
	#extraReachSetting = this.createSliderSetting("ExtraReach", 2, 2, 24, 1);
	#ignoreDeadSetting = this.createToggleSetting("IgnoreDead", true);

	get #extraReach() {
		return this.#extraReachSetting.value();
	}
	get #ignoreDead() {
		return this.#ignoreDeadSetting.value();
	}

	static readonly INSTANCE = new KillAura();

	@Bus.Subscribe("playerTick")
	private onTick() {
		const {players, player, network} = game;
		// network is undefined in the case of us not having `main`.
		// game can't be undefined, since well...
		// our hook runs when the player loop is called.
		// idk why I'm checking if players is null because it shouldn't.
		if (!network || !players || !player) return;
		const selfTeam = player.teamId;
		for (const oPlr of players.values()) {
			// const {rigidBody} = oPlr;
			if (oPlr === player || (this.#ignoreDead || oPlr.dead)) continue;
			if (!canAttack(selfTeam, oPlr.teamId)) continue;
			const look = lookAtPlayer(
				oPlr.pos,
				player.pos
			);
			RotationManager.scheduleRotation(new RotationPlan(look, 2));
			oPlr.addMeleeHitFlash();
			for (let i = 0; i < 9; i++) network.sendMeleeHitPlayer(
				oPlr.id,
				oPlr.currentSpawnId,
				player.id // myId
			);
		}
	}
}
