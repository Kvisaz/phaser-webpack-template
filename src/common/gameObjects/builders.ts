export type CommonGameObject =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Shape
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.NineSlice
  | Phaser.GameObjects.Zone;

export type GameObjectBuilder = () => CommonGameObject;
