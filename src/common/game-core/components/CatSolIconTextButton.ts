import { Align } from "@kvisaz/phaser-sugar";
import { ButtonChild, ContainerButton } from "./ContainerButton";
import { safeArray } from "../../collections";

export interface ITextButtonWithOptionalIconProps {
  bg: ButtonChild;
  buttonLabel: ButtonChild;
  buttonIcon?: ButtonChild;
  onClick: () => void;
  onOver?: () => void;
}

/**
 * текстовая кнопка в которой значок ставится справа
 * **/
export class CatSolIconTextButton extends ContainerButton {
  constructor({ bg, buttonLabel, buttonIcon, onClick, onOver }: ITextButtonWithOptionalIconProps) {
    super({
      gameObjects: safeArray([bg, buttonLabel, buttonIcon]),
      onClick,
      onOver,
      options: {
        disableAfterClick: {
          ms: 350,
        },
        once: false,
        onDisabled: (button) => button.setAlpha(0.8),
        onEnabled: (button) => button.setAlpha(1),
      },
    });
    const align = new Align();
    align.anchor(bg).center(buttonLabel);
    if (buttonIcon) {
      align
        .anchor(bg)
        .centerY(buttonIcon)
        .rightIn(buttonIcon, buttonIcon.getBounds().width / 2);
    }
    this.updateInteractiveZone();
  }
}
