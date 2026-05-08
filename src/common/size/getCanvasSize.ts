export function getCanvasSize(scene: Phaser.Scene): {
  width: number;
  height: number;
  widthPercent: number;
  heightPercent: number;
  squarePercent: number;
} {
  const { width, height } = scene.game.canvas;
  const widthPercent = Math.round(width / 100);
  const heightPercent = Math.round(width / 100);

  // useful for adaptive layout - imagine your app is square inside rectangle screen
  const squarePercent = Math.min(widthPercent, heightPercent);

  return {
    width,
    height,
    widthPercent,
    heightPercent,
    squarePercent,
  };
}

export function getSceneBounds(scene: Phaser.Scene): Phaser.Geom.Rectangle {
  const { width, height } = getCanvasSize(scene);
  return new Phaser.Geom.Rectangle(0, 0, width, height);
}
