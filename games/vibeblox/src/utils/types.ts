export type { GameHandle, ItemStack } from "@vape-rewrite/vibeblox-types/voxelGame";
export type { MultiplayerClient } from "@vape-rewrite/vibeblox-types/multiplayer";
import type { GameHandle } from "@vape-rewrite/vibeblox-types/voxelGame";

export type Entity = ReturnType<GameHandle["listEntities"]>[number];