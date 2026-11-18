import type { Gun } from "@wq2/rivals-shooter-types/src/weapons/weapons";

import { Category, createProxy, Mod } from "@vape-rewrite/core";

import { mod, type WeaponSystem, ready } from "@/utils/wrappers/weapons/WeaponSystem";

let origCurrentSpread: WeaponSystem["currentSpread"], origAfterShot: WeaponSystem["afterShot"];

export default class GunModifier extends Mod {
	name = "GunModifier";
	category = Category.COMBAT;

	#spreadSetting = this.createToggleSetting("Modify Spread", true);
	#spreadMultiplierSetting = this.createSliderSetting("Spread %", 0, 0, 100);
	#recoilSetting = this.createToggleSetting("Modify Recoil", true);
	#recoilYawSetting = this.createSliderSetting("Recoil Yaw%", 0, 0, 100);
	#recoilPitchSetting = this.createSliderSetting("Recoil Pitch%", 0, 0, 100);

	get #spread() {
		return this.#spreadSetting.value();
	}

	get #spreadMultiplier() {
		return this.#spreadMultiplierSetting.value();
	}

	get #recoil() {
		return this.#recoilSetting.value();
	}

	get #recoilYaw() {
		return this.#recoilYawSetting.value();
	}

	get #recoilPitch() {
		return this.#recoilPitchSetting.value();
	}

	#patchSpread() {
		origCurrentSpread = mod.WeaponSystem.prototype.currentSpread;
		mod.WeaponSystem.prototype.currentSpread = createProxy(origCurrentSpread, {
			apply: (target, thisArg, argArray: []) => {
				const spread = Reflect.apply(target, thisArg, argArray);
				const mul = this.#spreadMultiplier / 100;
				return spread * mul;
			},
		});
	}

	#modifySpreadValue(orig: number, t: "y" | "p") {
		let pc: number;
		switch (t) {
			case "y":
				pc = this.#recoilYaw;
				break;
			case "p":
				pc = this.#recoilPitch;
				break;
			default:
				return orig;
		}
		const mul = pc / 100;
		return orig * mul;
	}

	#patchRecoil() {
		const wsp = mod.WeaponSystem.prototype;
		origAfterShot = wsp.afterShot;
		wsp.afterShot = createProxy(origAfterShot, {
			apply: (target, thisArg: WeaponSystem, argArray: [d: Gun]) => {
				const [d] = argArray;
				const proxy = createProxy(d, {
					get: (t, p, r) => {
						const orig = Reflect.get(t, p, r);
						if (p !== "recoil" || !orig) return orig;
						return createProxy(orig, {
							get: (t, p, r) => {
								const orig = Reflect.get(t, p, r);
								if (typeof p !== "string") return orig;
								return this.#modifySpreadValue(orig, p.at(0)! as "y"|"p");
							}
						});
					},
				});
				return Reflect.apply(target, thisArg, [proxy]);
			},
		});
	}

	protected onEnable(): void {
		ready.then(() => {
			if (this.#spread) {
				this.#patchSpread();
			}
		});
		ready.then(() => {
			if (this.#recoil) {
				this.#patchRecoil();
			}
		});
	}
	protected onDisable(): void {
		ready.then(() => {
			if (this.#spread && origCurrentSpread) {
				mod.WeaponSystem.prototype.currentSpread = origCurrentSpread;
			}
			if (this.#recoil && origAfterShot) {
				mod.WeaponSystem.prototype.afterShot = origAfterShot;
			}
		});
	}
}
