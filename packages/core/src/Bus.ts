import type EventBus from "@wq2/event-bus";

import type { EventDict } from "@wq2/event-bus";
import createProxy from "./utils/helpers/proxy";

/**
 * The actual EventBus instance, set by the game-specific package at startup.
 * Core code accesses the bus through the default proxy export.
 */
let busInstance: EventBus<EventDict> | undefined;

/**
 * Set the global bus instance. Must be called once by the entry point
 * (e.g. packages/miniblox/src/Bus.ts) before any core code runs.
 */
export function setBusInstance(bus: EventBus<EventDict>): void {
	busInstance = bus;
}

/**
 * Get the current bus instance. Throws if not yet initialised.
 */
export function getBusInstance(): EventBus<EventDict> {
	if (!busInstance) {
		throw new Error(
			"Bus instance not initialised. Call setBusInstance() in the game entry point first.",
		);
	}
	return busInstance;
}

/**
 * Proxy that delegates every method call / property access to the
 * underlying EventBus returned by {@linkcode getBusInstance}.
 *
 * This lets core code do `Bus.registerSubscriber(this)` without
 * knowing which concrete EventBus implementation is in use.
 */
const Bus = createProxy({} as Record<string, (...args: any[]) => any>, {
	get(_target, prop, _receiver) {
		const bus = getBusInstance();
		const value = (bus as any)[prop];
		if (typeof value === "function") {
			return value.bind(bus);
		}
		return value;
	},
});

export default Bus;
