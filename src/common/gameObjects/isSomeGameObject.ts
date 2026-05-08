export function isContainer(obj: Phaser.GameObjects.GameObject): obj is Phaser.GameObjects.Container {
  return obj.type === "Container";
}

export function isImage(obj: Phaser.GameObjects.GameObject): obj is Phaser.GameObjects.Image {
  return obj.type === "Image";
}

export function isText(obj: Phaser.GameObjects.GameObject): obj is Phaser.GameObjects.Text {
  return obj.type === "Text";
}

