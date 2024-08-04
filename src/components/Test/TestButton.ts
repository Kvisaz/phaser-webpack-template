interface IProps {
  scene: Phaser.Scene;
  text: string;
}

export class TestButton extends Phaser.GameObjects.Container {
  constructor({ scene, text }: IProps) {
    super(scene);
    const textObject = scene.add.text(0, 0, text, { fontSize: "32px", color: "#dedede" });

    this.add([textObject]);
    scene.add.existing(this as Phaser.GameObjects.Container);
  }
}
