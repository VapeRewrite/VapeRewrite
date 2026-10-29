import type { Block, BlockState } from "@wq2/miniblox-sdk";

import type { BlockPos } from "@wq2/miniblox-sdk";

import PacketRefs from "../network/packetRefs";
import Miniblox from "../refs/miniblox";

export type BlockHandler = (b: BlockPos) => void;
export type BlockFilter = (b: BlockPos) => boolean;

export const blockHandlers = {
	rightClick(pos: BlockPos) {
		Miniblox.ClientSocket.sendPacket(
			new PacketRefs.s.SPacketClick({
				location: pos.toProto(),
			}),
		);
	},
	breakBlock(pos: BlockPos) {
		Miniblox.ClientSocket.sendPacket(
			new PacketRefs.s.SPacketBreakBlock({
				location: pos.toProto(),
				start: false,
			}),
		);
	},
} satisfies { [k: string]: BlockHandler };

// function isAir(b: Block) {
//  return b.material.air;
// }

export function isSolid(b: Block) {
	return b.material.isSolid();
}

export function withBlock<T>(fn: (block: Block) => T): (pos: BlockPos) => T {
	const { world } = Miniblox;
	if (world === undefined) throw new Error("Can't call withBlock(fn) while not in world");
	return (pos) => fn(world.getBlock(pos));
}

export function withBlockState<T>(fn: (block: BlockState) => T): (pos: BlockPos) => T {
	const { world } = Miniblox;
	if (world === undefined) throw new Error("Can't call withBlockState(fn) while not in world");
	return (pos) => fn(world.getBlockState(pos));
}

export const defaultFilter: BlockFilter = (b) =>
	// biome-ignore lint/style/noNonNullAssertion: you shouldn't call this while the world is null anyways
	isSolid(Miniblox.world!.getBlock(b));

function rangeBounds(hRange: number, vRange: number): [BlockPos, BlockPos] {
	const { player, BlockPos } = Miniblox;
	return [
		new BlockPos(player.pos.x - hRange, player.pos.y - vRange, player.pos.z - hRange),
		new BlockPos(player.pos.x + hRange, player.pos.y + vRange, player.pos.z + hRange),
	];
}

function* blockPositions(min: BlockPos, max: BlockPos): Generator<BlockPos> {
	const { BlockPos } = Miniblox;
	for (let x = min.x; x <= max.x; x++)
		for (let y = min.y; y <= max.y; y++)
			for (let z = min.z; z <= max.z; z++) yield new BlockPos(x, y, z);
}

export function allBlocksInRange(hRange: number, vRange: number = hRange): BlockPos[] {
	const [min, max] = rangeBounds(hRange, vRange);
	const { BlockPos } = Miniblox;
	return BlockPos.getAllInBoxMutable(min, max);
}

export function oneInRange(
	hRange: number,
	filter: BlockFilter,
	vRange: number = hRange,
): BlockPos | undefined {
	const [min, max] = rangeBounds(hRange, vRange);
	for (const pos of blockPositions(min, max)) {
		if (filter(pos)) return pos;
	}
	return undefined;
}
