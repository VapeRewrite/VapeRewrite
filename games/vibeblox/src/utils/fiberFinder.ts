export default function fiberFinder<T>(cb: (value: unknown) => boolean): T | undefined {
	const canvas = document.querySelector("canvas[data-engine]");
	if (!canvas) return null;

	const fiberKey = Object.keys(canvas)[0];
	if (!fiberKey) return null;
	let fiber = canvas[fiberKey];

	while (fiber) {
		const hook = fiber.memoizedState;
		let h = hook,
			guard = 0;
		while (h && guard++ < 10000) {
			const cur = h.memoizedState?.current;
			// the game handle: an object exposing its engine API
			if (
				cur && cb(cur)
			) {
				return cur;
			}
			h = h.next;
		}
		return null;
	}
	return null;
}
