import { Align } from "@kvisaz/phaser-sugar";
import { HtmlBodyBackground } from "../../html";

export interface IFullscreenOverlayProps {
  scene: Phaser.Scene;
  color?: number;
  alpha?: number;
  interactive?: boolean;
  manageHtmlOverlay?: boolean;
}

/**
 * Полноэкранный оверлей + HtmlBodyBackground.
 * Не управляет анимацией, просто создаёт и убирает прямоугольник.
 */
export class FullscreenOverlay extends Phaser.GameObjects.Rectangle {
  private readonly manageHtmlOverlay: boolean;

  constructor({
    scene,
    color = 0x000000,
    alpha = 0.2,
    interactive = false,
    manageHtmlOverlay = true,
  }: IFullscreenOverlayProps) {
    super(scene, 0, 0, scene.scale.width, scene.scale.height, color, alpha);
    this.manageHtmlOverlay = manageHtmlOverlay;
    this.setOrigin(0);
    this.setScrollFactor(0);
    if (interactive) {
      this.setInteractive({ useHandCursor: false });
    }

    new Align().anchorSceneScreen(scene).center(this);
    scene.add.existing(this);
    if (this.manageHtmlOverlay) {
      HtmlBodyBackground.showOverlay(alpha, true);
    }

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.manageHtmlOverlay) {
        HtmlBodyBackground.hideOverlay();
      }
    });
  }

  destroy(fromScene?: boolean): void {
    if (this.manageHtmlOverlay) {
      HtmlBodyBackground.hideOverlay();
    }
    super.destroy(fromScene);
  }
}
