export function sceneInterval(args: {
  scene: Phaser.Scene;
  periodMs: number;
  callback: () => void;
}) {
  const { scene, periodMs, callback } = args;
  if (scene == null) return () => {};
  if (periodMs === 0) {
    callback();
    return () => {};
  }
  const event = scene.time.addEvent({
    delay: periodMs,
    loop: true,
    callback,
  });
  return () => event.remove();
}
