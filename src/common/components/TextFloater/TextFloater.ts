/**
 * Всплывающий и тающий текст
 * для бонусов и очков к примеру
 */
import { DefaultTextFloaterProps, ITextFloaterConstructorArgs, ITextFloaterProps } from "./props";

export class TextFloater {
  private readonly props: ITextFloaterProps;
  private readonly textNode: Phaser.GameObjects.Text;

  constructor(props: ITextFloaterConstructorArgs) {
    this.props = {
      ...DefaultTextFloaterProps,
      ...props,
    };

    const { scene, text, textStyle = {}, x, y, origin = 0.5 } = this.props;
    this.textNode = new Phaser.GameObjects.Text(scene, x, y, text, textStyle).setOrigin(origin).setVisible(false);
  }

  /**
   * Запустить анимацию
   * если аргументы не заданы - использовать предыдущие
   */
  runAnimation(text = this.props.text, x = this.props.x, y = this.props.y) {
    const { textNode, props } = this;
    const { scene } = props;

    props.x = x;
    props.y = y;
    props.text = text;

    textNode.setText(text);
    scene.tweens.add(this.buildConfig(props));
  }

  private buildConfig(props: ITextFloaterProps): Phaser.Types.Tweens.TweenBuilderConfig {
    const { textNode } = this;
    const { scene, duration, velocityX, velocityY, x, y } = props;

    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: textNode,
      props: {
        alpha: 0,
        x: x + (duration * velocityX) / 1000,
        y: y + (duration * velocityY) / 1000,
      },
      duration,
      onStart: () => {
        textNode.x = x;
        textNode.y = y;
        scene.add.existing(textNode);
        textNode.setVisible(true);
        textNode.alpha = 1;
      },
      onComplete: () => textNode.setVisible(false),
    };
    return config;
  }
}
