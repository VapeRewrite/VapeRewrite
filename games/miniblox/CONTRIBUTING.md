# Contributing

To make a cheat for Miniblox, you need to understand how Miniblox works...

## Miniblox internals

- [Vite] (latest version, since they have Rolldown, and there's chunking/code splitting enabled because libraries like ThreeJS are in separate files, ESM)
- [ThreeJS] (r184, see the `canvas` with `data-engine="three.js r184"`)
- [TypeScript] (confirmed by enums being structured like IIFEs and way the too-many AI sloppenated comments in `index.html`)
- [NextJS] (?, app/client/**src/lib**/{...}.ts is a very common NextJS file structure)
- [React]
	- bundle code confirms it a LOT, and one AI sloppenated comment in `index.html` confirms this with a file path:
		> keep it roughly in sync with MODE_CONTENT in src/react/pages/Title/modeContent.ts
	- and the div element with `id="react"`
- [Unleash](https://github.com/Unleash/unleash) (feature flags)

[React]: https://react.dev/
[TypeScript]: https://www.typescriptlang.org/
[NextJS]: https://nextjs.org/
[Vite]: https://vite.dev/
[ThreeJS]: https://threejs.org/

## Useful bundle versions

Unfortunately,
Vector has done some things to make reverse-engineering a tiny bit harder.
It's not as hard, but finding some stuff is annoying sometimes
(i.e. remapping more fields/symbols).

[Useful bundle versions](https://github.com/MinibloxCheaters2/miniblox-sdk/blob/main/CONTRIBUTING.md#useful-bundle-versions)
