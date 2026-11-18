import gameRefs from "@/utils/refs/game";
import { mod } from "@/utils/wrappers/meta/Online";
import {Category, Mod} from "@vape-rewrite/core"
import { showNotification } from "@vape-rewrite/ui/src/notifications";

export default class StatSpoofer extends Mod {
	name = "StatSpoofer";
	category = Category.BLATANT;

	#rpSetting = this.createSliderSetting("RP", 4_000, 1, 4_000);

	get #rp() {
		return this.#rpSetting.value();
	}

	protected onEnable(): void {
		const {game: {profile}} = gameRefs;
		profile.data.rank.rp = this.#rp;
		profile.save();
		showNotification("StatSpoofer", "Spoofed stats!", "info", 0.3e3);
		mod.submitScore(profile);
		this.toggleSilently();
	}
}