export type GameObject =
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.RenderTexture
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.TileSprite;

export type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;