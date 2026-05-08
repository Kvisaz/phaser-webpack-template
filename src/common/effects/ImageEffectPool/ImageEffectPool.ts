import {IEffectPoint, IImageEffectAsset} from "../types";

interface IProps {
  scene: Phaser.Scene;
  parent?: Phaser.GameObjects.Container;
  asset: IImageEffectAsset;
  initialSize?: number;
}

/**
 * Пул image-частиц для коротких визуальных эффектов.
 *
 * Объекты не уничтожаются после каждого эффекта: они скрываются, сбрасываются
 * и переиспользуются следующим запуском.
 **/
export class ImageEffectPool {
  private readonly free: Phaser.GameObjects.Image[] = [];
  private readonly used = new Set<Phaser.GameObjects.Image>();

  constructor(private readonly props: IProps) {
    for (let i = 0; i < (props.initialSize ?? 0); i += 1) {
      this.free.push(this.createImage());
    }
  }

  acquire(spawnPoint: IEffectPoint, scale: number): Phaser.GameObjects.Image {
    const image = this.free.pop() ?? this.createImage();
    this.used.add(image);

    image.scene?.tweens.killTweensOf(image);
    image.setPosition(spawnPoint.x, spawnPoint.y);
    image.setScale(scale);
    image.setAlpha(1);
    image.setRotation(0);
    image.setVisible(true);
    image.setActive(true);

    return image;
  }

  release(image: Phaser.GameObjects.Image): void {
    if (!this.used.delete(image) || image.scene == null) {
      return;
    }

    image.scene.tweens.killTweensOf(image);
    image.setVisible(false);
    image.setActive(false);
    image.setAlpha(1);
    image.setScale(1);
    image.setRotation(0);
    this.free.push(image);
  }

  destroy(): void {
    [...this.used, ...this.free].forEach((image) => {
      image.scene?.tweens.killTweensOf(image);
      image.destroy();
    });
    this.used.clear();
    this.free.length = 0;
  }

  private createImage(): Phaser.GameObjects.Image {
    const {scene, parent, asset} = this.props;
    const image = scene.add.image(0, 0, asset.url, asset.frameName);

    parent?.add(image);
    image.setVisible(false);
    image.setActive(false);

    return image;
  }
}
