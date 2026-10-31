import { JSXHudElement as HudElement } from "@vape-rewrite/core";
import { createSignal } from "solid-js";

import Miniblox from "@/utils/refs/miniblox";

export default class SpeedHud extends HudElement {
	public name = "Speed";

	constructor() {
		super();
		this.id = "speed";
	}

	private fontSizeSetting = this.createSliderSetting("Font Size", 14, 8, 32, 1);
	private textColorSetting = this.createColorSliderSetting("Text Color", {
		h: 0,
		s: 0,
		v: 1,
		o: 1,
	});
	private speedSignal = createSignal(0);
	#updateFrame: number;

	public onAdd(): void {
		const update = () => {
			try {
				const { player } = Miniblox;
				if (!player) return this.#updateFrame = requestAnimationFrame(update);
				const vel = player.motion;
				const speed = Math.round(Math.hypot(vel.x, vel.z) * 100) / 100;
				this.speedSignal[1](speed);
			} catch {}
			this.#updateFrame = requestAnimationFrame(update);
		};
		update();
	}

	public onRemove(): void {
		if (this.#updateFrame) cancelAnimationFrame(this.#updateFrame);
	}

	public render() {
		const color = this.textColorSetting.value();
		const textColor = `rgba(${Math.round(color.h * 255)}, ${Math.round(color.s * 255)}, ${Math.round(color.v * 255)}, ${color.o})`;

		return (
			<div
				class="vape-hud-text"
				style={{
					"--hud-font-size": `${this.fontSizeSetting.value()}px`,
					"--hud-color": textColor,
				}}
			>
				Speed: {this.speedSignal[0]()} bps
			</div>
		);
	}
}
