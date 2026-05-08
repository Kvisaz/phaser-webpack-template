import {IFloatingTextEffectConfig} from "../types";

interface IProps {
  scene: Phaser.Scene;
  parent?: Phaser.GameObjects.Container;
  initialSize?: number;
}

/**
 * Пул всплывающих текстов для коротких UI-эффектов.
 *
 * Text дорогой для частого создания, поэтому слой эффектов возвращает его
 * в пул после завершения tween.
 **/
export class TextEffectPool {
  private readonly free: Phaser.GameObjects.Text[] = [];
  private readonly used = new Set<Phaser.GameObjects.Text>();

  constructor(private readonly props: IProps) {
    for (let i = 0; i < (props.initialSize ?? 0); i += 1) {
      this.free.push(this.createText());
    }
  }

  acquire(config: IFloatingTextEffectConfig): Phaser.GameObjects.Text {
    const text = this.free.pop() ?? this.createText();
    this.used.add(text);

    text.scene?.tweens.killTweensOf(text);
    text.setText(config.text);
    text.setStyle(config.style);
    text.setPosition(config.startPoint.x, config.startPoint.y);
    text.setOrigin(0.5);
    text.setScale(config.scaleFrom);
    text.setAlpha(1);
    text.setVisible(true);
    text.setActive(true);

    return text;
  }

  release(text: Phaser.GameObjects.Text): void {
    if (!this.used.delete(text) || text.scene == null) {
      return;
    }

    text.scene.tweens.killTweensOf(text);
    text.setVisible(false);
    text.setActive(false);
    text.setAlpha(1);
    text.setScale(1);
    this.free.push(text);
  }

  destroy(): void {
    [...this.used, ...this.free].forEach((text) => {
      text.scene?.tweens.killTweensOf(text);
      text.destroy();
    });
    this.used.clear();
    this.free.length = 0;
  }

  private createText(): Phaser.GameObjects.Text {
    const {scene, parent} = this.props;
    const text = scene.add.text(0, 0, "", {});

    parent?.add(text);
    text.setVisible(false);
    text.setActive(false);

    return text;
  }
}
