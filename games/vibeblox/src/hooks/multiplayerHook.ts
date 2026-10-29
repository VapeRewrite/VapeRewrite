import fiberFinder from "@/utils/fiberFinder";
import type { MultiplayerClient } from "@vape-rewrite/vibeblox-types/multiplayer";

export let mp: MultiplayerClient;

export default function hook() {
	return new Promise<MultiplayerClient>((resolve) => {
		const tick = () => {
			const h = fiberFinder<MultiplayerClient>(
				(hook) => typeof hook === "object" && "ws" in hook && "connect" in hook,
			);
			if (h) resolve(h);
			else setTimeout(tick, 500);
		};
		tick();
	});
}
export const ready = hook().then(m => mp = m);
