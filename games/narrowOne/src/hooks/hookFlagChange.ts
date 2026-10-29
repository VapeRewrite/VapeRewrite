import Bus from "@/Bus";
import gameRefs, { anyReady } from "@/utils/refs/game";
import { createProxy } from "@vape-rewrite/core";
import type { Flag, Player } from "@wq2/narrow-one-types";

let playerProto: Player, origChangeFlagFromServer: Player["changeFlagFromServer"];

export default function hook() {
    const {player} = gameRefs;
    if (!player) return;
    playerProto = Object.getPrototypeOf(player);
    origChangeFlagFromServer = playerProto.changeFlagFromServer;
    playerProto.changeFlagFromServer = createProxy(origChangeFlagFromServer, {
        apply(target, thisArg: Player, argArray: [flag: Flag, changeType: 0|1|2|3]) {
            Bus.emit("flagChange", {
                player: thisArg,
                flag: argArray[0],
                type: argArray[1]
            });
            return Reflect.apply(target, thisArg, argArray);
        },
    })
}

anyReady.then(hook);