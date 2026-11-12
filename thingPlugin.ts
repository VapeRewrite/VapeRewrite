import { type RolldownPlugin, RolldownMagicString } from "rolldown";

export default function dtsUserscriptPlugin(PKG: string): RolldownPlugin {
  // match things like "@wq2/waybackhq-types" or "@wq2/waybackhq-types/..."
  const pkgPrefix = PKG + "/";
  const pkgExact = PKG;

  return {
    name: "rolldown:dts-userscript-rewrite",

    // mark package specifiers as external so the resolver won't try to load them
    // (returns an object with external:true is supported by rollup-style plugins)
    async resolveId(source: string) {
      if (source === pkgExact || source.startsWith(pkgPrefix)) {
        // mark external so rolldown won't load/emit a module for it
        return { id: source, external: true };
      }
      return null;
    },

    // run in the renderChunk phase and rewrite dynamic-import(...) string arguments
    // -> import('@pkg/x')  ===> import('./x')
    async renderChunk(code: string /*, chunk, options */) {
      // quick bailout
      if (code.indexOf(PKG) === -1) return null;

      const ms = new RolldownMagicString(code);
      let changed = false;

      // 1) handle simple string-literal dynamic imports: import('pkg/x')
      // preserve original quote char by capturing it
      const reStringImport = new RegExp(`import\\(\\s*(['"\`])(${PKG}(?:\\/[^'"\`]*)?)\\1\\s*\\)`, "g");
      code.replace(reStringImport, (match, quote, spec, offset) => {
        // only rewrite dynamic imports (not static), we matched them
        const sub = spec === PKG ? "" : spec.slice(PKG.length + 1);
        const repl = sub ? `./${sub}` : "./";
        ms.overwrite(offset, offset + match.length, `import(${quote}${repl}.js${quote})`);
        changed = true;
        return match;
      });

      if (!changed) return null;
	  // this is a binding source map, but Rolldown doesn't want it,
	  // even though it lists it as a valid option?
	  const map = ms.generateMap({ hires: true });
      return { code: ms.toString(), map: map.toString() };
    },
  };
}
