export function sceneTimeout(args: { scene: Phaser.Scene; delay: number; callback: () => void }) {
  const { scene, delay, callback } = args;
  if (scene == null) return;
  if (delay === 0) {
    callback();
    return;
  }
  return scene.time.delayedCall(delay, callback);
}
