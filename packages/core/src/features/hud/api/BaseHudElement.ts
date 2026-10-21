import type {
	AnySetting,
	ColorSliderSetting,
	DropdownSetting,
	ModeLike,
	SliderSetting,
	TextBoxSetting,
	ToggleSetting,
} from "../../config/Settings";

import { createSignal, flush } from "solid-js";

export interface HudPosition {
	x: number;
	y: number;
}

export default abstract class BaseHudElement {
	/** The unique ID of this HUD element */
	public id: string = "";

	/** The name of this HUD element */
	public abstract name: string;

	/** HUD element settings */
	public settings: AnySetting[] = [];

	/** Position of the HUD element */
	private positionSignal = createSignal<HudPosition>({ x: 100, y: 100 });

	/** Is the HUD element visible? */
	private visibleSignal = createSignal(true);

	get positionAccessor() {
		return this.positionSignal[0];
	}

	get position() {
		return this.positionSignal[0]();
	}

	set position(value: HudPosition) {
		flush(() => {
			this.positionSignal[1](value);
		});
	}

	get visibleAccessor() {
		return this.visibleSignal[0];
	}

	get visible() {
		return this.visibleSignal[0]();
	}

	set visible(value: boolean) {
		// flush(() => {
		this.visibleSignal[1](value);
		// });
	}

	/**
	 * Called when the HUD element is added
	 */
	public onAdd(): void {}

	/**
	 * Called when the HUD element is removed
	 */
	public onRemove(): void {}

	// Helper methods to create settings
	protected createToggleSetting(
		name: string,
		defaultValue = false,
		visible?: () => boolean,
	): ToggleSetting {
		const [value, setValue] = createSignal(defaultValue);
		const setting: ToggleSetting = {
			name,
			type: "toggle",
			value,
			setValue,
			visible,
		};
		this.settings.push(setting);
		return setting;
	}

	protected createSliderSetting(
		name: string,
		defaultValue: number,
		min: number,
		max: number,
		step?: number,
		visible?: () => boolean,
	): SliderSetting {
		const [value, setValue] = createSignal(defaultValue);
		const setting: SliderSetting = {
			name,
			type: "slider",
			value,
			setValue,
			min,
			max,
			step,
			visible,
		};
		this.settings.push(setting);
		return setting;
	}

	protected createDropdownSetting<V extends ModeLike = string>(
		name: string,
		options: V[],
		defaultValue?: V,
		visible?: () => boolean,
	): DropdownSetting<V> {
		const [value, setValue] = createSignal<V>(() => defaultValue ?? options[0]!);
		const setting: DropdownSetting<V> = {
			name,
			type: "dropdown",
			value,
			setValue,
			options,
			visible,
		};
		this.settings.push(setting as unknown as DropdownSetting<ModeLike>);
		return setting;
	}

	protected createTextBoxSetting(
		name: string,
		defaultValue = "",
		placeholder?: string,
		visible?: () => boolean,
	): TextBoxSetting {
		const [value, setValue] = createSignal(defaultValue);
		const setting: TextBoxSetting = {
			name,
			type: "textbox",
			value,
			setValue,
			placeholder,
			visible,
		};
		this.settings.push(setting);
		return setting;
	}

	protected createColorSliderSetting(
		name: string,
		defaultValue: { h: number; s: number; v: number; o: number } = {
			h: 0.5,
			s: 1,
			v: 1,
			o: 1,
		},
		visible?: () => boolean,
	): ColorSliderSetting {
		const [color, setColor] = createSignal(defaultValue);

		const setting: ColorSliderSetting = {
			name,
			type: "colorslider",
			value: color,
			setValue: setColor,
			hue: () => color().h,
			sat: () => color().s,
			opacity: () => color().o,
			setColor: (h: number, s: number, v: number, o: number) => setColor({ h, s, v, o }),
			visible,
		};
		this.settings.push(setting);
		return setting;
	}
}
