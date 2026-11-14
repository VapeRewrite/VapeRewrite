import game from "../refs/game";
import THREE from "../refs/three";

function getMovementDirection() {
  const { player } = game;
  if (!player) return [0, 0];
  const { walkInput } = player.inputManager;
  const dir = new THREE.Vec3(walkInput.x, 0, walkInput.y);
  dir.applyQuaternion(player.getCamXRotQuaternion());
  const len = Math.hypot(dir.x, dir.z);
  if (len < 1e-4) return [0, 0];
  return [dir.x / len, dir.z / len];
}

export default function getMovement(speed: number): [number, number] {
	return getMovementDirection().map((x) => x * speed) as [number, number];
}
