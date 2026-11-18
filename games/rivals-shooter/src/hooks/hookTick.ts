import type { PhysicsTickData, PlayerTickData } from "@/events";
import type { Input } from "@wq2/rivals-shooter-types/src/core/Input";
import type { Player } from "@wq2/rivals-shooter-types/src/player/Player";
import type { Vector3 } from "three";

import { CancelableWrapper, createProxy } from "@vape-rewrite/core";

import bus from "@/Bus";
import { type Game } from "@/utils/wrappers/core/Game";

import { ready as hookReady } from "./gameHook";

let origTick: Game["tick"], origUpdate: Player["update"], origIntegrate: Player["integrate"];

function hook(game: Game) {
	function hookGameTick() {
		origTick = game.tick;
		game.tick = createProxy(origTick, {
			apply(target, thisArg, argArray) {
				bus.emit("gameTick");
				return Reflect.apply(target, thisArg, argArray);
			},
		});
	}
	function hookPlayerTick() {
		origUpdate = game.player.update;
		game.player.update = createProxy(origUpdate, {
			apply(target, thisArg: Player, argArray: [dt: number, input: Input]) {
				const [dt, input] = argArray;
				const c = new CancelableWrapper<PlayerTickData>({
					dt,
					input,
				});
				bus.emit("playerTick", c);
				const result = Reflect.apply(target, thisArg, argArray);
				return result;
			},
		});
	}
	function hookPlayerMove() {
		origIntegrate = game.player.integrate;
		game.player.integrate = createProxy(origIntegrate, {
			apply(
				target,
				thisArg,
				argArray: [h: number, wishDir: Vector3, wishAmount: number, sprint: boolean],
			) {
				const [h, wishDir, wishAmount, sprint] = argArray;
				const c = new CancelableWrapper<PhysicsTickData>({
					step: h,
					moveDir: wishDir,
					moveDirAmount: wishAmount,
					sprint,
				});
				bus.emit("physicsTick", c);
				if (c.canceled) return;
				const { data } = c;
				const a = Reflect.apply(target, thisArg, [
					data.step,
					data.moveDir,
					data.moveDirAmount,
					data.sprint,
				]);
				bus.emit("postPhysicsTick", data);
				return a;
			},
		});
	}
	hookGameTick();
	hookPlayerTick();
	hookPlayerMove();
}

hookReady.then(hook);
