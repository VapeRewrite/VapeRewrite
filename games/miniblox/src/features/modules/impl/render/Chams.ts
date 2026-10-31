import type { RenderPlayer } from "@wq2/miniblox-sdk";

import { Category, createProxy } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import Miniblox from "@/utils/refs/miniblox";

let origRenderPlayer: () => void, cRenderPlayer: RenderPlayer;

export default class Chams extends Mod {
	name = "Chams";
	category = Category.RENDER;

	onEnable() {
		const {player} = Miniblox;
		if (!player) return;
		const {mesh} = player;
		if (!mesh) return;
		cRenderPlayer = Object.getPrototypeOf(mesh) as RenderPlayer;
		origRenderPlayer = cRenderPlayer.render;
		cRenderPlayer.render = createProxy(origRenderPlayer, {
			apply(target, thisArg, argArray) {
				for (const mesh in this.meshes) {
					this.meshes[mesh].material.depthTest = false;
					this.meshes[mesh].renderOrder = 3;
				}

				for (const mesh in this.armorMesh) {
					this.armorMesh[mesh].material.depthTest = false;
					this.armorMesh[mesh].renderOrder = 4;
				}

				if (this.capeMesh) {
					this.capeMesh.children[0].material.depthTest = false;
					this.capeMesh.children[0].renderOrder = 5;
				}

				if (this.hatMesh) {
					for (const mesh of this.hatMesh.children[0].children) {
						if (!mesh.material) continue;
						mesh.material.depthTest = false;
						mesh.renderOrder = 4;
					}
				}
				return Reflect.apply(target, thisArg, argArray);
			},
		});
	}

	onDisable() {
		cRenderPlayer.render = origRenderPlayer;
		// TODO: bother with resetting all the mesh render orders
	}
}
