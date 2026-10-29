import { createModManager as create } from "@vape-rewrite/core";
import KillAura from "./features/modules/impl/blatant/KillAura";
import Scaffold from "./features/modules/impl/blatant/Scaffold";

create(
	new KillAura,
	new Scaffold
);
