import { Cancelable } from "@vape-rewrite/core";

type ClientEvents = {
	/** note: cancelling means the RAF loop doesn't run */
	preTick: Cancelable;
	postTick: void;
};

export default ClientEvents;
