import type { AnyPacket } from "@wq2/miniblox-sdk";

import { type ArrayVec3, CancelableWrapper, Category, type ColorSliderSetting, Mod, type ToggleSetting } from "@vape-rewrite/core";

import Bus from "@/Bus";
import { isS2C } from "@/utils";

enum OreType {
	Coal = 35,
	Iron = 33,
	Gold = 31,
	Lapis = 73,
	Diamond = 155,
	Redstone = 187,
	Emerald = 281
}
// const i2n = {
// 	31: "gold_ore",
// 	33: "iron_ore",
// 	35: "coal_ore",
// 	73: "lapis_ore",
// 	155: "diamond_ore",
// 	187: "redstone_ore",
// 	281: "emerald_ore"
// };

export default class OreESP extends Mod {
	name = "OreESPThatIDidNotFinishDO_NOT_USE_OR_YOU_WILL_BE_FIRED";
	category = Category.RENDER;
	#oreToggles = new Map<OreType, ToggleSetting>();
	#oreColors = new Map<OreType, ColorSliderSetting>();
	constructor() {
		super();
		for (const [k, v] of Object.entries(OreType)) {
			if (typeof v === "string") continue;
			this.#oreToggles.set(v, this.createToggleSetting(k, true));
			this.#oreColors.set(v, this.createColorSliderSetting(k));
		}
	}
	#getOreInfo(t: OreType) {
		const toggled = this.#oreToggles.get(t)?.value();
		if (!t) return false;
		return this.#oreColors.get(t)!.value();
	}
	#ores = new Map<ArrayVec3, OreType>();
	async scan() {}
	@Bus.Subscribe("receivePacket")
	private onPacket({ data: p }: CancelableWrapper<AnyPacket>) {
		if (isS2C("CPacketBlockUpdate", p)) {
			const av3 = [p.x, p.y, p.z];
			const showOre = this.#getOreInfo(p.id);
		}
	}
}
