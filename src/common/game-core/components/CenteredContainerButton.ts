import { Align } from "@kvisaz/phaser-sugar";
import { ContainerButton, IContainerButtonProps } from "./ContainerButton";

/** универсальная кнопка, неизменяемая, фиксированных размеров **/
export class CenteredContainerButton extends ContainerButton {
  constructor(props: IContainerButtonProps) {
    const { gameObjects } = props;
    const [bg, ...content] = gameObjects;
    const align = new Align(bg);
    content.forEach((nextChild) => {
      align.center(nextChild);
    });
    super(props);
    this.updateInteractiveZone();
  }
}
