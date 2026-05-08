import { sceneTimeout } from "./sceneTimeout";

export async function delayScenic(ms: number, scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve) =>
    sceneTimeout({
      scene,
      delay: ms,
      callback: resolve,
    }),
  );
}
