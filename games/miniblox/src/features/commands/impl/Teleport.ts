import { CommandDispatcher as dispatcher } from "@vape-rewrite/core";
import { argument, FloatArgumentType, literal } from "@wq2/brigadier-ts";

import Miniblox from "@/utils/refs/miniblox";

dispatcher.register(
	literal("tp").then(
		argument("x", new FloatArgumentType()).then(
			argument("y", new FloatArgumentType()).then(
				argument("z", new FloatArgumentType()).executes(async (e) => {
					const x = e.get<number>("x");
					const y = e.get<number>("y");
					const z = e.get<number>("z");
					Miniblox.player.setPosition(x, y, z);
					Miniblox.chat.addChat({
						text: `Teleported to ${x} ${y} ${z}`,
						color: "blue",
					});
				}),
			),
		),
	),
);
