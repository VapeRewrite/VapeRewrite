import { JSXHudElement as HudElement } from "@vape-rewrite/core";
import { createSignal } from "solid-js";

import Miniblox from "@/utils/refs/miniblox";

export default class FPSHud extends HudElement {
	public name = "FPS";
	#fpsAnimationFrame: number;

	constructor() {
		super();
		this.id = "fps";
	}

	private fontSizeSetting = this.createSliderSetting("Font Size", 14, 8, 32, 1);
	private textColorSetting = this.createColorSliderSetting("Text Color", {
		h: 0,
		s: 0,
		v: 1,
		o: 1,
	});

	private fpsSignal = createSignal(0);
	private lastFrameTime = performance.now();
	private frameCount = 0;
	private fpsUpdateInterval = 500;

	public onAdd(): void {
		const updateFPS = () => {
			this.frameCount++;
			const now = performance.now();
			const elapsed = now - this.lastFrameTime;

			if (elapsed >= this.fpsUpdateInterval) {
				const fps = Miniblox.game.resourceMonitor.filteredFPS;
				this.fpsSignal[1](fps);
				this.frameCount = 0;
				this.lastFrameTime = now;
			}

			this.#fpsAnimationFrame = requestAnimationFrame(updateFPS);
		};

		updateFPS();
	}

	public onRemove(): void {
		if (this.#fpsAnimationFrame) {
			cancelAnimationFrame(this.#fpsAnimationFrame);
		}
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
				FPS: {this.fpsSignal[0]()}
			</div>
		);
	}
}
