import type { Line, LineBasicMaterial } from "three";

import { LegitModule } from "@vape-rewrite/core";
import { shadowWrapper } from "@vape-rewrite/core";

import Miniblox from "@/utils/refs/miniblox";
import THREE from "@/utils/refs/three";

import { register } from "./shared";

const BROWSER_FONTS = [
	"Arial",
	"Verdana",
	"Courier New",
	"Georgia",
	"Times New Roman",
	"Tahoma",
	"Trebuchet MS",
	"Impact",
	"Comic Sans MS",
	"Consolas",
	"Monaco",
	"Lucida Console",
	"system-ui",
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
];

class Atmosphere extends LegitModule {
	readonly name = "Atmosphere";
	readonly tooltip = "Custom lighting & fog";

	readonly rain = this.createToggleSetting("Rain");
	readonly thunder = this.createToggleSetting("Thunder");
	readonly rainStrength = this.createSliderSetting("Rain Strength", 1, 0, 1, 0.01);
	readonly thunderStrength = this.createSliderSetting("Thunder Strength", 1, 0, 1, 0.01);

	#savedRain = false;
	#savedThunder = false;
	#savedRainStrength = 0;
	#savedThunderStrength = 0;

	onToggle() {
		const w = Miniblox.world;
		if (this.enabled) {
			this.#savedRain = w.raining;
			this.#savedThunder = w.thundering;
			this.#savedRainStrength = w.rainingStrength;
			this.#savedThunderStrength = w.thunderingStrength;
			w.raining = this.rain.value();
			w.thundering = this.thunder.value();
			w.rainingStrength = this.rainStrength.value();
			w.thunderingStrength = this.thunderStrength.value();
		} else {
			w.raining = this.#savedRain;
			w.thundering = this.#savedThunder;
			w.rainingStrength = this.#savedRainStrength;
			w.thunderingStrength = this.#savedThunderStrength;
		}
	}
}
register(new Atmosphere());

class Breadcrumbs extends LegitModule {
	readonly name = "Breadcrumbs";
	readonly tooltip = "Shows a trail behind your character";
	private readonly lifetimeSetting = this.createSliderSetting("Lifetime", 3, 1, 10, 0.1);
	private readonly spacingSetting = this.createSliderSetting("Spacing", 1, 0.5, 5, 0.01);
	private readonly colorSetting = this.createColorSliderSetting("Color", {
		h: 0.5,
		s: 0,
		v: 1,
		o: 1,
	});

	get lifetime() {
		return this.lifetimeSetting.value();
	}

	get spacing() {
		return this.spacingSetting.value();
	}

	get color() {
		return this.colorSetting.value();
	}

	#points: Array<{ x: number; y: number; z: number; time: number }> = [];
	#lastSpawn: { x: number; y: number; z: number } | null = null;
	#rafId = 0;
	#line: Line | null = null;
	#material: LineBasicMaterial | null = null;

	onToggle() {
		if (this.enabled) {
			const geo = new THREE.BufferGeometry();
			this.#material = new THREE.LineBasicMaterial({ color: 0xffffff });
			const line = new THREE.Line(geo, this.#material);
			line.visible = false;
			this.#line = line;
			Miniblox.game.gameScene.scene.add(this.#line);
			this.#lastSpawn = null;
			this.#startLoop();
		} else {
			cancelAnimationFrame(this.#rafId);
			if (this.#line) {
				Miniblox.game.gameScene.scene.remove(this.#line);
				this.#line.geometry.clearGroups();
				this.#line = null;
			}
			this.#material = null;
			this.#points = [];
		}
	}

	#startLoop() {
		const tick = () => {
			if (!this.enabled) return;
			const player = Miniblox.player;
			if (!player?.pos || !this.#line) {
				this.#rafId = requestAnimationFrame(tick);
				return;
			}

			const now = performance.now() / 1000;
			const pos = { x: player.pos.x, y: player.pos.y, z: player.pos.z };

			if (this.#lastSpawn) {
				const dx = pos.x - this.#lastSpawn.x;
				const dy = pos.y - this.#lastSpawn.y;
				const dz = pos.z - this.#lastSpawn.z;
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

				if (dist >= this.spacing) {
					this.#points.push({ ...pos, time: now });
					this.#lastSpawn = pos;
				}
			} else {
				this.#points.push({ ...pos, time: now });
				this.#lastSpawn = pos;
			}

			const maxLife = this.lifetime;
			while (this.#points.length > 0 && now - this.#points[0].time > maxLife) {
				this.#points.shift();
			}

			if (this.#points.length >= 2) {
				const coords: number[] = [];
				for (const p of this.#points) {
					coords.push(p.x, p.y, p.z);
				}
				const arr = new Float32Array(coords);
				this.#line.geometry.clearGroups();
				this.#line.geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
				this.#line.visible = true;
			} else {
				this.#line.visible = false;
			}

			const c = this.color;
			const hex =
				(Math.round(c.v * 255) << 16) | (Math.round(c.v * 255) << 8) | Math.round(c.v * 255);
			this.#material?.color.setHex(hex);

			this.#rafId = requestAnimationFrame(tick);
		};
		this.#rafId = requestAnimationFrame(tick);
	}
}
register(new Breadcrumbs());

class Clock extends LegitModule {
	name = "Clock";
	tooltip = "Shows the current local time";
	readonly customSize = { width: 100, height: 41 };
	readonly font = this.createDropdownSetting("Font", BROWSER_FONTS);
	readonly color = this.createColorSliderSetting("Color", {
		h: 0,
		s: 0,
		v: 0,
		o: 0.5,
	});
	readonly twentyFourHour = this.createToggleSetting("24 Hour Clock");
}
register(new Clock());

class FOV extends LegitModule {
	readonly name = "FOV";
	readonly tooltip = "Adjusts camera field of view";
	readonly value = this.createSliderSetting("FOV", 70, 30, 120);
}
register(new FOV());

class FPS extends LegitModule {
	readonly name = "FPS";
	readonly tooltip = "Shows the current framerate";
	readonly customSize = { width: 100, height: 41 };
	readonly font = this.createDropdownSetting("Font", BROWSER_FONTS);
	readonly color = this.createColorSliderSetting("Color", {
		h: 0,
		s: 0,
		v: 0,
		o: 0.5,
	});
}
register(new FPS());

class Keystrokes extends LegitModule {
	readonly name = "Keystrokes";
	readonly tooltip = "Shows movement keys on-screen";
	readonly customSize = { width: 110, height: 176 };
	readonly keyStyle = this.createDropdownSetting("Key Style", ["Keyboard", "Arrow"]);
	readonly color = this.createColorSliderSetting("Color", {
		h: 0,
		s: 0,
		v: 0,
		o: 0.5,
	});
	readonly showSpacebar = this.createToggleSetting("Show Spacebar", true);
}
register(new Keystrokes());

class Memory extends LegitModule {
	readonly name = "Memory";
	readonly tooltip = "Shows current JS heap usage";
	readonly customSize = { width: 100, height: 41 };
	readonly font = this.createDropdownSetting("Font", BROWSER_FONTS);
	readonly color = this.createColorSliderSetting("Color", {
		h: 0,
		s: 0,
		v: 0,
		o: 0.5,
	});
}
register(new Memory());

class Ping extends LegitModule {
	readonly name = "Ping";
	readonly tooltip = "Shows connection latency to the server";
	readonly customSize = { width: 100, height: 41 };
	readonly font = this.createDropdownSetting("Font", BROWSER_FONTS);
	readonly color = this.createColorSliderSetting("Color", {
		h: 0,
		s: 0,
		v: 0,
		o: 0.5,
	});
}
register(new Ping());

class Speedometer extends LegitModule {
	readonly name = "Speedometer";
	readonly tooltip = "Shows average velocity in blocks/tick";
	readonly customSize = { width: 100, height: 41 };
	readonly font = this.createDropdownSetting("Font", BROWSER_FONTS);
	readonly color = this.createColorSliderSetting("Color", {
		h: 0.5,
		s: 0,
		v: 0,
		o: 0.5,
	});

	#overlay: HTMLDivElement | null = null;
	#rafId = 0;
	#lastPos: { x: number; y: number; z: number } | null = null;
	#lastTime = 0;

	onToggle() {
		if (this.enabled) {
			this.#lastPos = null;
			this.#lastTime = 0;
			this.#overlay = document.createElement("div");
			Object.assign(this.#overlay.style, {
				position: "fixed",
				bottom: "20px",
				left: "50%",
				transform: "translateX(-50%)",
				color: "#fff",
				"font-size": "16px",
				"font-family": "Arial, sans-serif",
				"text-shadow": "0 0 4px rgba(0,0,0,0.8)",
				"pointer-events": "none",
				"z-index": "10003",
			});
			this.#overlay.textContent = "0.0 sps";
			shadowWrapper.wrapper.appendChild(
				this.#overlay,
			);
			this.#startLoop();
		} else {
			cancelAnimationFrame(this.#rafId);
			this.#overlay?.remove();
			this.#overlay = null;
		}
	}

	#startLoop() {
		const tick = () => {
			if (!this.enabled) return;
			const player = Miniblox.player;
			if (!player?.pos) {
				this.#rafId = requestAnimationFrame(tick);
				return;
			}

			const now = performance.now() / 1000;
			const pos = {
				x: player.pos.x,
				y: player.pos.y,
				z: player.pos.z,
			};

			if (this.#lastPos && this.#lastTime > 0) {
				const dt = now - this.#lastTime;
				if (dt > 0) {
					const dx = pos.x - this.#lastPos.x;
					const dy = pos.y - this.#lastPos.y;
					const dz = pos.z - this.#lastPos.z;
					const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
					const sps = dist / dt;
					if (this.#overlay) {
						this.#overlay.textContent = `${sps.toFixed(1)} sps`;
					}
				}
			}

			this.#lastPos = pos;
			this.#lastTime = now;
			this.#rafId = requestAnimationFrame(tick);
		};
		this.#rafId = requestAnimationFrame(tick);
	}
}
register(new Speedometer());

class TimeChanger extends LegitModule {
	readonly name = "Time Changer";
	readonly tooltip = "Change the time of the current world";
	readonly time = this.createSliderSetting("Time", 6000, 0, 24000, 1);

	#savedTime = 0;

	onToggle() {
		const w = Miniblox.world;
		if (!w) return;
		if (this.enabled) {
			this.#savedTime = w.worldTime;
			w.worldTime = this.time.value();
		} else w.worldTime = this.#savedTime;
	}
}
register(new TimeChanger());
