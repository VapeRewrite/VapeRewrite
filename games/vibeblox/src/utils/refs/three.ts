import hookDelta from "@/hooks/hookDelta";
import { expose } from "@vape-rewrite/core";
import type { Clock, PerspectiveCamera, Scene, Vector3 } from "three";

let clockConstructor: typeof Clock, lastConstructedClock: Clock;
let sceneConstructor: typeof Scene, lastConstructedScene: Scene;
let perspectiveCameraConstructor: typeof PerspectiveCamera, lastConstructedCamera: PerspectiveCamera;

Object.defineProperty(Object.prototype, "autoStart", {
	configurable: true,
	enumerable: false,
	get() {
		const ts = this as Clock;
		console.log("autoStart accessed:", ts);
		clockConstructor = ts.constructor as typeof Clock;
		lastConstructedClock = ts;
		delete Object.prototype["autoStart"];
		return ts.autoStart;
	},
	set(v) {
		const ts = this as Clock;
		console.log("autoStart set:", ts);
		clockConstructor = ts.constructor as typeof Clock;
		lastConstructedClock = ts;
		delete Object.prototype["autoStart"];
		this.autoStart = v;
	},
});

Object.defineProperty(Object.prototype, "backgroundBlurriness", {
	configurable: true,
	enumerable: false,
	get() {
		const ts = this as Scene;
		console.log("backgroundBlurriness accessed:", ts);
		sceneConstructor = ts.constructor as typeof Scene;
		lastConstructedScene = ts;
		delete Object.prototype["backgroundBlurriness"];
		return true;
	},
	set(v) {
		sceneConstructor = this.constructor as typeof Scene;
		lastConstructedScene = this as Scene;
		delete Object.prototype["backgroundBlurriness"];
		lastConstructedScene.backgroundBlurriness = v;
	},
});

Object.defineProperty(Object.prototype, "filmGauge", {
	configurable: true,
	enumerable: false,
	get() {
		const ts = this as PerspectiveCamera;
		console.log("filmGauge accessed:", ts);
		perspectiveCameraConstructor = ts.constructor as typeof PerspectiveCamera;
		lastConstructedCamera = ts;
		delete Object.prototype["filmGauge"];
		return true;
	},
	set(v) {
		lastConstructedCamera = this as PerspectiveCamera;
		delete Object.prototype["filmGauge"];
		lastConstructedCamera.filmGauge = v;
	},
});

const THREE = {
	get Clock(): typeof Clock {
		return clockConstructor;
	},
	get Scene(): typeof Scene {
		return sceneConstructor;
	},
	get PerspectiveCamera(): typeof PerspectiveCamera {
		return perspectiveCameraConstructor;
	},
	get Vector3() {
		return THREE.Scene?.DEFAULT_UP.constructor as typeof Vector3;
	},
	get lastDelta() {
		return hookDelta.d;
	},
	get currentClock(): Clock {
		return lastConstructedClock;
	},
	get currentScene() {
		return lastConstructedScene;
	},
	get currentCamera() {
		return lastConstructedCamera;
	}
};
export default THREE;
expose("THREE", () => THREE);