import { createModManager as create } from "@vape-rewrite/core";
import KillAura from "./features/modules/impl/blatant/KillAura";
import Scaffold from "./features/modules/impl/blatant/Scaffold";
import Speed from "./features/modules/impl/blatant/Speed";
import Fly from "./features/modules/impl/blatant/Fly";

create(
	new KillAura,
	new Speed,
	new Fly,
	new Scaffold
);
