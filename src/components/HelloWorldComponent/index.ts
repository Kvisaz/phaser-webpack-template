export class HelloWorldComponent extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const text = scene.add.text(0, 0, "Hello Phaser!", { color: "#000000", fontSize: "72px" });
    this.add(text);
  }
}
