import Refs from "@/hooks/game";

type ReplicationDirection = "server" | "client" | "both";

/**
 * Swings the player's hand
 @param [replicateTo="both"] replicate to the server, client, or both.
 */
export default function swing(replicateTo: ReplicationDirection = "both") {
	const { netRole, session, localPlayer: player } = Refs.game;
	const both = replicateTo === "both";
	const [client, server] = [both || replicateTo === "client", both || replicateTo === "server"];
	if (client) player.swingItem();
	if (netRole === "client" && session && server) {
		session.sendSwing();
	}
}
