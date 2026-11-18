import { REAL_CLIENT_NAME } from "@vape-rewrite/core";
import { JSXHudElement as HudElement } from "@vape-rewrite/core";
import { ModuleManager } from "@vape-rewrite/core";
import { rainbowMode, rainbowSpeed, rainbowUpdateRate } from "@vape-rewrite/core";
import { getResourceURL } from "@vape-rewrite/core";
import { createSignal, For } from "solid-js";

function hsvToRgb(h: number, s: number, v: number, o = 1): string {
	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);

	let r: number;
	let g: number;
	let b: number;

	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
			r = v;
			g = p;
			b = q;
			break;
		default:
			r = 0;
			g = 0;
			b = 0;
	}

	return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${o})`;
}

function colorCurve(h: number): number {
	let s = 0.75 + 0.15 * Math.min(h / 0.03, 1);
	if (h > 0.57) {
		s = 0.9 - 0.4 * Math.min((h - 0.57) / 0.09, 1);
	}
	if (h > 0.66) {
		s = 0.5 + 0.4 * Math.min((h - 0.66) / 0.16, 1);
	}
	if (h > 0.87) {
		s = 0.9 - 0.15 * Math.min((h - 0.87) / 0.13, 1);
	}
	return s;
}

export default class ArrayListHud extends HudElement {
	public name = "Text GUI";

	constructor() {
		super();
		this.id = "arraylist";
	}

	private fontSizeSetting = this.createSliderSetting("Font Size", 14, 8, 32, 1);
	private fontFamilySetting = this.createDropdownSetting(
		"Font",
		["Arial", "Verdana", "Courier New", "Georgia", "Times New Roman"],
		"Arial",
	);
	private alignmentSetting = this.createDropdownSetting(
		"Alignment",
		["Auto", "Left", "Right"],
		"Auto",
	);
	private rainbowSetting = this.createToggleSetting("Rainbow", false);
	private textColorSetting = this.createColorSliderSetting("Text Color", {
		h: 0,
		s: 0,
		v: 0.78,
		o: 1,
	});
	private shadowColorSetting = this.createColorSliderSetting("Shadow Color", {
		h: 0,
		s: 0,
		v: 0,
		o: 0.8,
	});
	private showLogoSetting = this.createToggleSetting("Show Logo", true);
	private addCustomTextSetting = this.createToggleSetting("Add custom text", false);
	private customTextContentSetting = this.createTextBoxSetting("Custom text", "");
	private customFontSetting = this.createDropdownSetting(
		"Custom Font",
		["Arial", "Verdana", "Courier New", "Georgia", "Times New Roman"],
		"Arial",
	);
	private setCustomTextColorToggle = this.createToggleSetting("Set custom text color", false);
	private customTextColorSetting = this.createColorSliderSetting("Color of custom text", {
		h: 0,
		s: 0,
		v: 0.78,
		o: 1,
	});

	private rainbowOffsetSignal = createSignal(0);
	#rainbowTimer?: ReturnType<typeof setTimeout>;

	public onAdd(): void {
		const updateInterval = () => {
			const rate = rainbowUpdateRate();
			return rate > 0 ? 1000 / rate : 16;
		};

		const tick = () => {
			const speed = rainbowSpeed();
			this.rainbowOffsetSignal[1]((this.rainbowOffsetSignal[0]() + 0.2 * speed * (1 / 60)) % 1);
			this.#rainbowTimer = setTimeout(tick, updateInterval());
		};

		this.#rainbowTimer = setTimeout(tick, updateInterval());
	}

	public onRemove(): void {
		if (this.#rainbowTimer !== undefined) {
			clearTimeout(this.#rainbowTimer);
		}
	}

	private getRainbowColor(index: number): string {
		if (!this.rainbowSetting.value()) {
			return hsvToRgb(
				this.textColorSetting.value().h,
				this.textColorSetting.value().s,
				this.textColorSetting.value().v,
				this.textColorSetting.value().o,
			);
		}
		const mode = rainbowMode();
		const baseHue = this.rainbowOffsetSignal[0]();
		const alpha = this.textColorSetting.value().o;

		if (mode === "Gradient") {
			const hue = (baseHue + index * 0.15) % 1;
			const s = colorCurve(hue);
			return hsvToRgb(hue, s, 1, alpha);
		}
		if (mode === "Retro") {
			const retroColors = [
				[0.0, 1, 1],
				[0.17, 1, 1],
				[0.33, 1, 1],
				[0.5, 1, 1],
				[0.67, 1, 1],
				[0.83, 1, 1],
			];
			const band = Math.floor(baseHue * retroColors.length) % retroColors.length;
			const [h, s, v] = retroColors[band];
			return hsvToRgb(h, s, v, alpha);
		}
		const hue = (baseHue + index * 0.05) % 1;
		const s = colorCurve(hue);
		return hsvToRgb(hue, s, 1, alpha);
	}

	private getShadowColor(): string {
		return hsvToRgb(
			this.shadowColorSetting.value().h,
			this.shadowColorSetting.value().s,
			this.shadowColorSetting.value().v,
			this.shadowColorSetting.value().o,
		);
	}

	public render() {
		const modules = ModuleManager.instance.modules.map((a) => ({
			name: a.name,
			tag: a.tagAccessor,
			enabled: a.stateAccessor,
		}));

		const sortedModules = () => {
			return modules
				.filter((a) => a.enabled())
				.sort((a, b) => {
					const aLen = a.name.length + ((a.tag()?.length ?? -3) + 3);
					const bLen = b.name.length + ((b.tag()?.length ?? -3) + 3);
					return bLen - aLen;
				});
		};

		const isRightSide = () => {
			const alignment = this.alignmentSetting.value();
			if (alignment === "Left") return false;
			if (alignment === "Right") return true;
			return this.position.x > window.innerWidth / 2;
		};

		return (
			<div
				style={{
					"--hud-font": this.fontFamilySetting.value(),
				}}
			>
				{this.showLogoSetting.value() && (
					<div
						style={{
							display: "flex",
							"align-items": "center",
							"justify-content": isRightSide() ? "flex-end" : "flex-start",
							"margin-bottom": "4px",
							gap: "2px",
						}}
					>
						<img
							src={getResourceURL("textvape")}
							alt={REAL_CLIENT_NAME}
							style={{
								height: `${this.fontSizeSetting.value() + 4}px`,
								filter: this.rainbowSetting.value()
									? `drop-shadow(0 0 8px ${this.getRainbowColor(0)}) drop-shadow(2px 2px 2px ${this.getShadowColor()})`
									: `drop-shadow(2px 2px 2px ${this.getShadowColor()})`,
							}}
						/>
						<img
							src={getResourceURL("textv4")}
							alt="V4"
							style={{
								height: `${this.fontSizeSetting.value() + 2}px`,
								filter: this.rainbowSetting.value()
									? `drop-shadow(0 0 8px ${this.getRainbowColor(1)}) drop-shadow(2px 2px 2px ${this.getShadowColor()})`
									: `drop-shadow(2px 2px 2px ${this.getShadowColor()})`,
							}}
						/>
					</div>
				)}

				{this.addCustomTextSetting.value() && this.customTextContentSetting.value() !== "" && (
					<div
						class="vape-hud-text"
						style={{
							"--hud-font-size": "25px",
							"--hud-font": this.customFontSetting.value(),
							"--hud-color": this.setCustomTextColorToggle.value()
								? hsvToRgb(
										this.customTextColorSetting.value().h,
										this.customTextColorSetting.value().s,
										this.customTextColorSetting.value().v,
										this.customTextColorSetting.value().o,
									)
								: this.getRainbowColor(0),
							"--hud-shadow": `2px 2px 2px ${this.getShadowColor()}`,
							"letter-spacing": "0.3px",
							padding: "1px 4px",
							"justify-content": isRightSide() ? "flex-end" : "flex-start",
							"text-align": isRightSide() ? "right" : "left",
							"margin-bottom": "4px",
						}}
					>
						{this.customTextContentSetting.value()}
					</div>
				)}

				<div
					style={{
						display: "flex",
						"flex-direction": "column",
						"align-items": isRightSide() ? "flex-end" : "flex-start",
						gap: "1px",
					}}
				>
					<For each={sortedModules()}>
						{(module, index) => (
							<div
								class="vape-hud-text"
								style={{
									"--hud-font-size": `${this.fontSizeSetting.value()}px`,
									"--hud-color": this.getRainbowColor(index()),
									"--hud-shadow": `2px 2px 2px ${this.getShadowColor()}`,
									"letter-spacing": "0.3px",
									padding: "1px 4px",
								}}
							>
								{module.name}
								{module.tag() ? ` [${module.tag()}]` : ""}
							</div>
						)}
					</For>
				</div>
			</div>
		);
	}
}
