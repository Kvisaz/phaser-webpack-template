export interface ICanvasImageProps {
  scene: Phaser.Scene;
  textureKey: string;
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export class CanvasImage extends Phaser.GameObjects.Image {
  constructor(props: ICanvasImageProps) {
    const { scene, draw, width, height, textureKey } = props;
    const { textures } = scene;

    if (!textures.exists(textureKey)) {
      const canvasTexture = scene.textures.createCanvas(
        textureKey,
        width,
        height
      );
      if (canvasTexture == null) {
        console.warn("null scene.textures.createCanvas");
      } else {
        draw(canvasTexture.getContext());
        canvasTexture.refresh();
      }
    }
    super(scene, 0, 0, textureKey);
  }
}
