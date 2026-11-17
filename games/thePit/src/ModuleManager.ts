import { createModManager as create } from "@vape-rewrite/core";

import ClientCrasher from "./features/modules/impl/blatant/ClientCrasher";
import Speed from "./features/modules/impl/blatant/Speed";
import AutoWin from "./features/modules/impl/utility/AutoWin";

create(
	new Speed(),
	new ClientCrasher(),
	new AutoWin,
);
