import Bus from "@/Bus";
import gameRefs, { anyReady } from "@/utils/refs/game";
import { createProxy } from "@vape-rewrite/core";
import type { Player } from "@wq2/narrow-one-types";

let playerProto: Player, origReceivedSpawn: Player["receivedSpawn"];

export default function hook() {
    const {player} = gameRefs;
    playerProto = Object.getPrototypeOf(player);
    origReceivedSpawn = playerProto.receivedSpawn;
    playerProto.receivedSpawn = createProxy(origReceivedSpawn, {
        apply(target, thisArg: Player, argArray: [spawnID: number, key: number]) {
            Bus.emit("receivedSpawn", {player, ID: argArray[0], key: argArray[1]});
            return Reflect.apply(target, thisArg, argArray);
        },
    });
}

anyReady.then(hook);