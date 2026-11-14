import { createModManager as create } from "@vape-rewrite/core";

import Fly from "./features/modules/impl/blatant/Fly";
import Speed from "./features/modules/impl/blatant/Speed";
import AutoWin from "./features/modules/impl/utility/AutoWin";

create(
	new Speed(),
	new Fly(),
	new AutoWin,
);
