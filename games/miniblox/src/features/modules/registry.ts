import { createModManager as create } from "@vape-rewrite/core";

// blatant
import Blink from "./impl/blatant/Blink";
import Fly from "./impl/blatant/fly";
import KillAura from "./impl/blatant/KillAura";
import MaceKill from "./impl/blatant/MaceKill";
import NoSlow from "./impl/blatant/NoSlow";
import Phase from "./impl/blatant/Phase";
import Scaffold from "./impl/blatant/Scaffold";
import Speed from "./impl/blatant/speed";
import Spider from "./impl/blatant/Spider";
import TargetStrafe from "./impl/blatant/TargetStrafe";
import TickBase from "./impl/blatant/TickBase";
// combat
import AutoClicker from "./impl/combat/AutoClicker";
import Criticals from "./impl/combat/Criticals";
import NoRecoil from "./impl/combat/NoRecoil";
import Velocity from "./impl/combat/Velocity";
import WTap from "./impl/combat/WTap";
// inventory
import AutoArmor from "./impl/inventory/AutoArmor";
import InventoryManager from "./impl/inventory/InventoryManager";
// minigames
import Breaker from "./impl/minigames/Breaker";
import ChestAura from "./impl/minigames/ChestAura";
import ChestStealer from "./impl/minigames/ChestStealer";
import MurderMystery from "./impl/minigames/MurderMystery";
// render
import Chams from "./impl/render/Chams";
// utility
import AdBypass from "./impl/utility/AdBypass";
import AntiBan from "./impl/utility/AntiBan";
import AntiSpamBypass from "./impl/utility/AntiSpamBypass";
import AutoRejoin from "./impl/utility/AutoRejoin";
import AutoRespawn from "./impl/utility/AutoRespawn";
import AutoSword from "./impl/utility/AutoSword";
import Dupe from "./impl/utility/dupe/Dupe";
import FakeLag from "./impl/utility/FakeLag";
import FilterBypass from "./impl/utility/FilterBypass";
import NoFlash from "./impl/utility/NoFlashbang";
import PacketLogger from "./impl/utility/PacketLogger";
import Paranoia from "./impl/utility/Paranoia";
import PingSpoof from "./impl/utility/PingSpoof";
import RejoinOnMute from "./impl/utility/RejoinOnMute";
import Sprint from "./impl/utility/Sprint";
import Test from "./impl/utility/Test";
// world
import LiquidWalk from "./impl/world/LiquidWalk";
import NoFall from "./impl/world/NoFall";
import Timer from "./impl/world/Timer";
import Lunge from "./impl/combat/Lunge";
import TPAura from "./impl/blatant/TPAura";
import OreESP from "./impl/render/OreESP";

export const mm = create(
	// blatant
	new Blink(),
	new Fly(),
	new KillAura(),
	new MaceKill(),
	new NoSlow(),
	new Phase(),
	new Scaffold(),
	new Spider(),
	new Speed(),
	new TargetStrafe(),
	new TickBase(),
	new TPAura,

	// combat
	new AutoClicker(),
	new Criticals(),
	new NoRecoil(),
	new Velocity(),
	new WTap(),
	new Lunge(),

	// inventory
	new AutoArmor(),
	new InventoryManager(),

	// minigames
	new Breaker(),
	new ChestAura(),
	new ChestStealer(),
	new MurderMystery(),

	// render
	new Chams(),
	new OreESP,

	// utility
	AdBypass.INSTANCE,
	AntiBan.INSTANCE,
	new AntiSpamBypass(),
	new AutoRejoin(),
	new AutoRespawn(),
	new AutoSword(),
	Dupe.INSTANCE,
	new FakeLag(),
	new FilterBypass(),
	new NoFlash(),
	new PacketLogger(),
	new Paranoia(),
	new PingSpoof(),
	new RejoinOnMute(),
	new Sprint(),
	new Test(),

	// world
	new LiquidWalk(),
	new NoFall(),
	new Timer(),
);
