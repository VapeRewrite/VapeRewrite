import { setBusInstance } from "@vape-rewrite/core";
import EventBus from "@wq2/event-bus";

import type ClientEvents from "./events";

const bus = new EventBus<ClientEvents>();
setBusInstance(bus);

export default bus;
