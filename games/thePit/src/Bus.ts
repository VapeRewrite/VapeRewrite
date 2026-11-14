import { setBusInstance } from "@vape-rewrite/core";
import EventBus from "@wq2/event-bus";

import type ClientEvents from "./events";

const Bus = new EventBus<ClientEvents>();
setBusInstance(Bus);

export default Bus;
