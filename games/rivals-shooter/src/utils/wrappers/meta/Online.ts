type GameModule = typeof import("@wq2/rivals-shooter-types/src/meta/Online");

export let mod: GameModule;
export const ready = import("@wq2/rivals-shooter-types/src/meta/Online").then((x) => (mod = x));

export type {
	accountName,
	fetchBoard,
	initAccount,
	isLoggedIn,
	login,
	onAccountChange,
	submitScore,
} from "@wq2/rivals-shooter-types/src/meta/Online";
