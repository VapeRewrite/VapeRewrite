# VapeRewrite

Currently the only UserScript cheeto for Miniblox that is being updated frequently.
(ballcrack is really outdated and has little to no features compared to this)

Also supports:

- [Narrow one](https://narrow.one)
- [Narrow one (CLASSIC, game servers are down so host your own)](https://classic.narrow.one)
- [WaybackHQ (devs broke the game.waybackhq.com server this uses for multiplayer servers & fetching schemas at load time, so its also broken)](https://waybackhq.com)
- [Kirka.io](https://kirka.io) (see [its own ReadME](games/kirka/ReadME.md))

## A note on developer console injection

This will be supported never (too lazy), but
as we have swapped out code replacement-based injection on Miniblox
for our own hooking method, and it now runs way after the page loads, its very possible.

## Development (using [Bun](https://bun.sh))

``` shell
# Compile and watch (executes)
$ bun run dev

# To build script and minify the code
# (TODO: fix minification with whitespace/comments removal breaking builds again)
$ bun run build

# Linting to check for any errors
$ bun run lint
```
