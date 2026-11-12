import { createModManager as create } from "@vape-rewrite/core";
// import KillAura from "./features/modules/impl/blatant/KillAura";
import Speed from "./features/modules/impl/blatant/Speed";
import Fly from "./features/modules/impl/blatant/Fly";
import AimAssistMod from "./features/modules/impl/combat/AimAssist";
import GunModifier from "./features/modules/impl/combat/GunModifier";
import StatSpoofer from "./features/modules/impl/blatant/StatSpoofer";

create(
	// new KillAura, // unimplemented
	new Speed,
	new Fly,
	new AimAssistMod,
	new GunModifier,
	new StatSpoofer
);
