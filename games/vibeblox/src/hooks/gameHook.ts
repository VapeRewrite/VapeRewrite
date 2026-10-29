import fiberFinder from "@/utils/fiberFinder";
import type { GameHandle } from "@/utils/types";

export let handle: GameHandle;

export default function hook() {
	return new Promise<GameHandle>((resolve) => {
		const tick = () => {
			const h = fiberFinder<GameHandle>(
				(hook) =>
					typeof hook === "object" &&
					"setPlayerLook" in hook 
			);
			if (h) resolve(h);
			else setTimeout(tick, 500);
		};
		tick();
	});
}

export const ready = hook().then((h) => (handle = h));
