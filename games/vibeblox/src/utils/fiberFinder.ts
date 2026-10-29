export default function fiberFinder<T>(cb: (value: unknown) => boolean): T | undefined {
	const canvas = document.querySelector("canvas[data-engine]");
	if (!canvas) return undefined;

	const fiberKey = Object.keys(canvas).find(
		(k) => k.startsWith("__reactFiber$") || k.startsWith("__reactContainer$"),
	);
	if (!fiberKey) return undefined;
	let fiber: any = (canvas as any)[fiberKey];

	let guard = 0;
	while (fiber && guard++ < 200) {
		let h = fiber.memoizedState;
		let hGuard = 0;
		while (h && hGuard++ < 10000) {
			const v = h.memoizedState;
			const cur = v && typeof v === "object" && "current" in v ? v.current : v;
			if (cur && cb(cur)) return cur;
			h = h.next;
		}
		fiber = fiber.return;
	}
	return undefined;
}
