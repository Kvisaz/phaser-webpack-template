import {IFloatingTextEffectConfig} from "../types";
import {TextEffectPool} from "../TextEffectPool";

interface IProps {
  scene: Phaser.Scene;
  parent?: Phaser.GameObjects.Container;
  pool?: TextEffectPool;
  config: IFloatingTextEffectConfig;
  onComplete?: () => void;
}

/**
 * Одноразовый всплывающий текст.
 *
 * Если передан пул, берет Text из пула и возвращает его после завершения.
 **/
export class FloatingTextEffect {
  private readonly text: Phaser.GameObjects.Text;
  private isDestroyed = false;

  constructor(private readonly props: IProps) {
    const {scene, config} = props;
    this.text = props.pool?.acquire(config)
      ?? scene.add.text(config.startPoint.x, config.startPoint.y, config.text, config.style);

    if (props.pool == null) {
      props.parent?.add(this.text);
      this.text.setOrigin(0.5);
      this.text.setScale(config.scaleFrom);
      this.text.setAlpha(1);
    }

    this.run();
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.text.scene?.tweens.killTweensOf(this.text);

    if (this.props.pool != null) {
      this.props.pool.release(this.text);
      return;
    }

    this.text.destroy();
  }

  private run(): void {
    const {scene, config} = this.props;

    scene.tweens.add({
      targets: this.text,
      x: config.startPoint.x + (config.duration * config.velocityX) / 1000,
      y: config.startPoint.y + (config.duration * config.velocityY) / 1000,
      alpha: 0,
      scaleX: config.scaleTo,
      scaleY: config.scaleTo,
      duration: config.duration,
      ease: Phaser.Math.Easing.Cubic.Out,
      onComplete: () => {
        this.props.onComplete?.();
        this.destroy();
      },
    });
  }
}
