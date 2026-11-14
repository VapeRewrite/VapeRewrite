import { expose } from "@vape-rewrite/core";

type ThreeModule = typeof import("three");
type ThreeExport = keyof ThreeModule;

function getThreeImport(): string | undefined {
	return performance.getEntriesByType("resource").find((x) => {
		const { name } = x;
		return name.startsWith("https://narrow.one/js/colors-") && name.endsWith(".js");
	})?.name;
}

function importColorsNoRetry() {
	const scriptURL = getThreeImport();
	if (!scriptURL) return undefined;
	return import(scriptURL);
}

/**
 * Imports colors.js, which mostly contains ThreeJS and other types of thingies.
 */
function importColors() {
	const scriptURL = getThreeImport();
	if (!scriptURL)
		return new Promise<any>((r) => {
			let t: number;
			t = setInterval(() => {
				const colors = importColorsNoRetry();
				if (!colors) return;
				r(colors);
				clearInterval(t);
			}, 5);
		});
	return import(scriptURL);
}

let three: object;

importColors().then((t) => {
	three = t;
	expose("THREE_RAW", () => t);
});

function findObject(filter: (clazz: NewableFunction) => boolean) {
	return Object.values(three).find(filter);
}

function findByPrototypeKey<T extends ThreeExport>(key: string): ThreeModule[T] {
	return findObject((x) => {
		return (
			typeof x === "function" &&
			"prototype" in x &&
			typeof x.prototype === "object" &&
			key in x.prototype &&
			x.prototype[key]
		);
	});
}

function findObjectByType<const N extends ThreeExport>(type: N): ThreeModule[N] {
	return findObject(
		(x) => x != null && typeof x === "function" && x.toString().includes(`this.type="${type}"`),
	);
}

const THREE = {
	get BoxGeometry() {
		return findObjectByType("BoxGeometry");
	},

	get BufferAttribute() {
		return findByPrototypeKey<"BufferAttribute">("isBufferAttribute");
	},

	get BufferGeometry() {
		return findObjectByType("BufferGeometry");
	},

	// colors.js bundle doesn't export this
	// get MathUtils(): ThreeModule["MathUtils"] {
	// 	return findObject(x => typeof x === "object"
	// 		&& Object.getPrototypeOf(x) === null
	// 		&& "clamp" in x
	// 		&& "DEG2RAD" in x);
	// },

	get lerp(): (a: number, b: number, t: number) => number {
		return Object.values(three).find(
			(x) =>
				typeof x === "function" &&
				x.length === 3 &&
				/return \w\+\s*\w\s*\*\s*\(\w\s*-\s*\w*\)/.test(x.toString()),
		);
	},

	get mapRange() {
		return Object.values(three).find((x) => {
			const baseline = typeof x === "function" && x.length === 5;
			if (!baseline) return false; // this literally filters out everything but the actual function. this alone probably works fine but I'm lazy so I'm not going to be lazy and leave it there
			const code = x.toString();
			return ["return", "let ", "=!1" /* matches the s=!1 default thingy */].every((q) =>
				code.includes(q),
			);
		});
	},

	get Line() {
		return findObjectByType("Line");
	},

	get LineBasicMaterial() {
		return findObjectByType("LineBasicMaterial");
	},

	get Mesh() {
		return findObjectByType("Mesh");
	},

	get MeshBasicMaterial() {
		return findObjectByType("MeshBasicMaterial");
	},

	get Quaternion() {
		return findByPrototypeKey<"Quaternion">("isQuaternion");
	},

	get Vec3() {
		return findByPrototypeKey<"Vector3">("isVector3");
	},

	get Euler() {
		return findByPrototypeKey<"Euler">("isEuler");
	},

	// dropped by bundler
	// get Spherical() {
	// 	return findByPrototypeKey<"Spherical">("isSpherical");
	// },

	get Vec2() {
		return findByPrototypeKey<"Vector2">("isVector2");
	},
};

expose("THREE", () => THREE);

export default THREE;
