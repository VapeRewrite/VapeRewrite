// ── Bus ──────────────────────────────────────────────────────────────
export { setBusInstance, getBusInstance, default as Bus } from "./Bus";

// ── Client ───────────────────────────────────────────────────────────
export { COMMAND_PREFIX, INJECT_DATE, REAL_CLIENT_NAME, clientName } from "./Client";

// ── Debug ────────────────────────────────────────────────────────────
export {
	CHECK_UNMATCHED_DUMPS,
	LOG_REMAPPING,
	EXPOSE_SYMBOLS,
	LOG_EXPOSE_NAME,
} from "./debugControls";

// ── Expose ───────────────────────────────────────────────────────────
export { expose, store } from "./exposed";

// ── Event ────────────────────────────────────────────────────────────
export { default as EventBus, Priority, Subscribe, SubscribeAsync } from "./event/Bus";
export { default as Cancelable } from "./event/Cancelable";
export { default as CancelableWrapper } from "./event/CancelableWrapper";

// ── Host ─────────────────────────────────────────────────────────────
export { default as shadowWrapper } from "./host/shadowWrapper";

// ── Modules API ──────────────────────────────────────────────────────
export {
	create as createModManager,
	P,
	default as ModuleManager,
} from "./features/modules/api/ModuleManager";
export { default as Mod } from "./features/modules/api/Module";
export { Category, CategoryInfo, categoryInfoSet } from "./features/modules/api/Category";
export type { CategoryData } from "./features/modules/api/Category";
export { default as LegitModule } from "./features/modules/api/LegitModule";
export { default as LegitModuleManager } from "./features/modules/api/LegitModuleManager";

// hooks
export { default as hideExposed } from "./hooks/hideExposed";
export { default as hideStack } from "./hooks/hideStack";

// ── Config ───────────────────────────────────────────────────────────
export { default as Configurable } from "./features/config/Configurable";
export { default as SubModule } from "./features/config/SubModule";
export { getName } from "./features/config/Settings";
export type {
	BaseSetting,
	ToggleSetting,
	SliderSetting,
	Tagged,
	DropdownSetting,
	TextBoxSetting,
	ColorSliderSetting,
	ColorSettingValue,
	SubmoduleSetting,
	SubmoduleItem,
	ModeLike,
	AnySetting,
} from "./features/config/Settings";
export {
	ModuleConfig,
	Config,
	NamedConfig,
	configKey,
	isConfigKey,
	loadedConfig,
	saveConfig,
	loadConfig,
	exportConfig,
	importConfig,
	listConfigs,
	initConfig,
	updateLoadedConfig,
} from "./features/config/configs";
export type { SerializedSetting } from "./features/config/configs";

// ── Global settings ──────────────────────────────────────────────────
export {
	notificationsEnabled,
	setNotificationsEnabled,
	toggleAlertEnabled,
	setToggleAlertEnabled,
	teamsByServerEnabled,
	setTeamsByServerEnabled,
	rainbowMode,
	setRainbowMode,
	rainbowSpeed,
	setRainbowSpeed,
	rainbowUpdateRate,
	setRainbowUpdateRate,
	guiThemeRainbow,
	setGuiThemeRainbow,
	blurBackground,
	setBlurBackground,
	guiBindIndicator,
	setGuiBindIndicator,
	showTooltips,
	setShowTooltips,
	showLegitMode,
	setShowLegitMode,
	scaleValue,
	setScaleValue,
	useTeamColor,
	setUseTeamColor,
	multiKeybinding,
	setMultiKeybinding,
	friendsList,
	setFriendsList,
	friendsEnabled,
	setFriendsEnabled,
	recolorVisuals,
	setRecolorVisuals,
	useFriends,
	setUseFriends,
	friendsColorHue,
	setFriendsColorHue,
	friendsColorSat,
	setFriendsColorSat,
	friendsColorVal,
	setFriendsColorVal,
	targetsList,
	setTargetsList,
	targetsEnabled,
	setTargetsEnabled,
	targetPlayersEnabled,
	setTargetPlayersEnabled,
	targetNPCsEnabled,
	setTargetNPCsEnabled,
	showHealth,
	setShowHealth,
	injureMode,
	setInjureMode,
} from "./features/settings/globalSettings";

// ── GUI ──────────────────────────────────────────────────────────────
export { guiVisible, setGuiVisible, toggleGUI } from "./features/gui/visibility";

// ── Binds ────────────────────────────────────────────────────────────
export { addBind, setBind, removeBind, normalizeCase } from "./features/binds/handler";
export type { Callback } from "./features/binds/handler";
export { saveBinds, loadBinds } from "./features/binds/storage";

// ── Commands ─────────────────────────────────────────────────────────
export { default as CommandDispatcher } from "./features/commands/api/CommandDispatcher";
export { default as ModuleArgumentType } from "./features/commands/api/brigadier/ModuleArgumentType";
export { MODULE_NOT_FOUND } from "./features/commands/api/brigadier/ModuleArgumentType";

// ── HUD API ──────────────────────────────────────────────────────────
export { default as BaseHudElement } from "./features/hud/api/BaseHudElement";
export type { HudPosition } from "./features/hud/api/BaseHudElement";
export { default as CanvasHudElement } from "./features/hud/api/CanvasHudElement";
export { default as JSXHudElement } from "./features/hud/api/JSXHudElement";
export { default as HudManager } from "./features/hud/api/HudManager";

// ── Logging ──────────────────────────────────────────────────────────
export { Logger } from "./utils/logging/Logger";
export { default as logger, MAIN_LOGGER, PATCH_LOGGER } from "./utils/logging/loggers";

// ── Utils: math ──────────────────────────────────────────────────────
export { SimpleVec3, SimpleVec2 } from "./utils/math/vec";
export type { ArrayVec3, ArrayVec2 } from "./utils/math/vec";
export { DEG2RAD, default as deg2rad } from "./utils/math/radians";

// ── Utils: time ──────────────────────────────────────────────────────
export { default as waitTicks, waitTick } from "./utils/time/wait";
export { randomString, randomIntInclusive, getRandomArbitrary } from "./utils/time/random";

// ── Utils: helpers ───────────────────────────────────────────────────
export { default as createProxy } from "./utils/helpers/proxy";
export { default as initOrR } from "./utils/helpers/initOrR";
export { default as delay } from "./utils/helpers/delay";
export { default as getResourceURL } from "./utils/helpers/cachedResourceURL";
export { getParent, getInheritanceChain } from "./utils/helpers/tree";
export type { Constructor } from "./utils/helpers/tree";
export { reverseMapping, default as remapObj } from "./utils/helpers/remapProxy";
export type { Mapping } from "./utils/helpers/remapProxy";

// ── Utils: misc ──────────────────────────────────────────────────────
export { siteKey } from "./utils/siteKey";
export { dragHandleAttrName, exposedName } from "./utils/mapping/names";
