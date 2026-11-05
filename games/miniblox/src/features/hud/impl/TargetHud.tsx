import type { EntityLivingBase } from "@wq2/miniblox-sdk";

import { JSXHudElement as HudElement } from "@vape-rewrite/core";
import { guiVisible } from "@vape-rewrite/core";
import { createSignal } from "solid-js";

import { getMostRecentTarget } from "@/utils/movement/TargetTracker";
import Miniblox from "@/utils/refs/miniblox";

interface TargetInfo {
	name: string;
	health: number;
	maxHealth: number;
	absorption: number;
}

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
		default:
			r = v;
			g = p;
			b = q;
			break;
	}

	return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${o})`;
}

const HEAD_AVATAR = (
	<svg width="26" height="27" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">
		<rect x="0" y="0" width="8" height="8" fill="#6DA058" />
		<rect x="0" y="0" width="8" height="3" fill="#543B2A" />
		<rect x="0" y="3" width="1" height="5" fill="#543B2A" />
		<rect x="7" y="3" width="1" height="5" fill="#543B2A" />
		<rect x="2" y="4" width="1" height="1" fill="#FFFFFF" />
		<rect x="5" y="4" width="1" height="1" fill="#FFFFFF" />
		<rect x="2" y="5" width="1" height="1" fill="#5C4033" />
		<rect x="5" y="5" width="1" height="1" fill="#5C4033" />
		<rect x="3" y="4" width="2" height="1" fill="#6DA058" />
		<rect x="3" y="5" width="2" height="1" fill="#6DA058" />
		<rect x="3" y="6" width="2" height="1" fill="#7A5C47" />
		<rect x="2" y="6" width="1" height="1" fill="#7A5C47" />
		<rect x="5" y="6" width="1" height="1" fill="#7A5C47" />
	</svg>
);

/** Minimal local clone of the SDK's make2DCanvas helper (absent from src/). */
function make2DCanvas(
	width: number,
	height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;
	return { canvas, ctx };
}

async function renderSkinHead(entity: EntityLivingBase): Promise<string | null> {
	const manager = Miniblox.skinManager;
	const id = "profile" in entity
		? (entity as EntityLivingBase & { profile: { cosmetics: { skin: string } } }).profile.cosmetics.skin
		: null;
	if (id && !manager.hasSkin(id)) {
		try {
			await manager.downloadSkin(id);
		} catch {}
	}

	const skin = manager.getSkin(id);
	const image = skin?.atlas?.image;
	if (!image) return null;

	const ratio = skin.ratio;
	const a = ratio * 8;
	const { canvas, ctx } = make2DCanvas(a * 8, a * 8);
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, ratio * 8, ratio * 8, a, a, 0, 0, a * 8, a * 8);
	ctx.drawImage(image, ratio * 40, ratio * 8, a, a, 0, 0, a * 8, a * 8);
	return canvas.toDataURL();
}

export default class TargetHud extends HudElement {
	public name = "Target Info";

	constructor() {
		super();
		this.id = "target";
	}

	private fontSetting = this.createDropdownSetting(
		"Font",
		["Arial", "Verdana", "Courier New", "Georgia", "Times New Roman"],
		"Arial",
	);
	private useDisplayNameSetting = this.createToggleSetting("Use Displayname", true);
	private renderBackgroundSetting = this.createToggleSetting("Render Background", true);
	private transparencySetting = this.createSliderSetting("Transparency", 0.5, 0, 1, 0.05);
	private customColorSetting = this.createToggleSetting("Custom Color", false);
	private colorSetting = this.createColorSliderSetting(
		"Color",
		{ h: 0.4, s: 0.89, v: 0.75, o: 1 },
		() => this.customColorSetting.value(),
	);
	private borderSetting = this.createToggleSetting("Border", false);
	private borderColorSetting = this.createColorSliderSetting(
		"Border Color",
		{ h: 0, s: 0, v: 1, o: 1 },
		() => this.borderSetting.value(),
	);

	private targetSignal = createSignal<TargetInfo | null>(null);
	private avatarSignal = createSignal<string | null>(null);
	#avatarCache = new Map<EntityLivingBase, string>();
	#avatarEntity: EntityLivingBase | null = null;
	#avatarId = 0;
	#updateFrame = 0;

	private resolveTarget(): EntityLivingBase | null {
		// Show the local player while the HUD editor preview is active.
		if (Miniblox.chat.showInput) return Miniblox.player ?? null;
		const recent = getMostRecentTarget();
		if (recent) return recent;
		return null;
	}

	private refreshAvatar(target: EntityLivingBase | null): void {
		if (this.#avatarEntity === target) return;
		this.#avatarEntity = target;

		if (!target) {
			this.avatarSignal[1](null);
			return;
		}

		const cached = this.#avatarCache.get(target);
		if (cached) {
			this.avatarSignal[1](cached);
			return;
		}

		this.avatarSignal[1](null);
		const id = ++this.#avatarId;
		void renderSkinHead(target).then((url) => {
			if (id !== this.#avatarId || !url) return;
			this.#avatarCache.set(target, url);
			if (this.#avatarCache.size > 64) {
				const oldest = this.#avatarCache.keys().next().value;
				if (oldest) this.#avatarCache.delete(oldest);
			}
			this.avatarSignal[1](url);
		});
	}

	private getName(target: EntityLivingBase): string {
		const raw = this.useDisplayNameSetting.value() ? target.getDisplayName?.() : target.getName?.();
		const name = String(raw ?? target.id ?? "").replace(/§./g, "");
		return name || String(target.id);
	}

	public onAdd(): void {
		const update = () => {
			try {
				const target = this.resolveTarget();
				this.refreshAvatar(target);

				if (target) {
					const health = target.getHealth?.() ?? 0;
					const maxHealth = target.getMaxHealth?.() ?? health;

					this.targetSignal[1]({
						name: this.getName(target),
						health,
						maxHealth,
						absorption: target.absorptionAmount ?? 0,
					});
				} else {
					this.targetSignal[1](null);
				}
			} catch {}
			this.#updateFrame = requestAnimationFrame(update);
		};
		update();
	}

	public onRemove(): void {
		if (this.#updateFrame) cancelAnimationFrame(this.#updateFrame);
	}

	public render() {
		const target = this.targetSignal[0]();
		const avatar = this.avatarSignal[0]();
		if (!target && !guiVisible()) return null;

		const transparency = Math.min(1, Math.max(0, this.transparencySetting.value()));
		const renderBackground = this.renderBackgroundSetting.value();
		const background = renderBackground ? `rgba(0, 0, 0, ${transparency})` : "transparent";

		let border = "none";
		if (this.borderSetting.value()) {
			const c = this.borderColorSetting.value();
			border = `1px solid ${hsvToRgb(c.h, c.s, c.v, c.o)}`;
		}

		const healthPct = target && target.maxHealth > 0 ? target.health / target.maxHealth : 0;
		const overhealPct =
			target && target.maxHealth > 0 ? (target.health + target.absorption) / target.maxHealth : 0;

		const fillScale = Math.max(0, Math.min(1, healthPct));
		const extraScale = Math.max(0, Math.min(0.8, overhealPct - 1));

		const fillColor = this.customColorSetting.value()
			? (() => {
					const c = this.colorSetting.value();
					return hsvToRgb(c.h, c.s, c.v, 1);
				})()
			: hsvToRgb(Math.max(0, Math.min(1, healthPct / 2.5)), 0.89, 0.75, 1);

		return (
			<div
				class="vape-hud-panel vape-target-hud"
				style={{
					width: "240px",
					height: "89px",
					padding: "0",
					background,
					"backdrop-filter": renderBackground ? "blur(4px)" : undefined,
					border,
					"font-family": this.fontSetting.value(),
				}}
			>
				<div class="vape-target-avatar">
					{avatar ? (
						<img
							src={avatar}
							alt=""
							style={{
								width: "100%",
								height: "100%",
								"image-rendering": "pixelated",
								"object-fit": "fill",
							}}
						/>
					) : (
						HEAD_AVATAR
					)}
				</div>
				{target && (
					<div
						class="vape-target-name"
						style={{
							"text-shadow": "1px 1px 0 rgba(0, 0, 0, 0.55)",
						}}
					>
						{target.name}
					</div>
				)}
				<div class="vape-target-health-bkg">
					<div
						class="vape-target-health-fill"
						style={{
							width: `${fillScale * 100}%`,
							background: fillColor,
						}}
					/>
					<div
						class="vape-target-health-extra"
						style={{
							width: `${extraScale * 100}%`,
						}}
					/>
				</div>
			</div>
		);
	}
}
