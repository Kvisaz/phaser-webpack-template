import { Align, AlignObject, cssColorToInt } from "@kvisaz/phaser-sugar";
import { FullscreenOverlay } from "./FullscreenOverlay";

type ChildObject = AlignObject & Phaser.GameObjects.GameObject;

export interface ICommonDialogProps {
  content: ChildObject;
  bgBuilder: (w: number, h: number) => ChildObject;
  /** options **/
  beforeOpen?: () => void;
  onClose?: () => void;
  isAutoOpen?: boolean;
  /**
   * жестко задает размер если задано
   * иначе рассчитывается как content.width + padding*2
   * **/
  width?: number;
  /**
   * жестко задает размер если задано
   * иначе рассчитывается как content.width + padding*2
   * **/
  height?: number;
  padding?: number;
  overlayAlpha?: number;
  overlayColor?: string;
  animationDuration?: number;
  isCloseOnOverlayClick?: boolean;
}

/**
 *  Общий шаблон диалоговой логики - фон, оверлей, анимации
 *  Внимание - диалог не уничтожается после скрытия по умолчанию
 *  Внимание 2 - используется хак с HtmlBodyBackground
 **/
export class CommonDialog extends Phaser.GameObjects.Container {
  protected overlay: Phaser.GameObjects.Rectangle | undefined;
  protected align = new Align();
  protected readonly background: AlignObject & Phaser.GameObjects.GameObject;
  protected isOffScreen = true;

  constructor(protected props: ICommonDialogProps) {
    super(props.content.scene, 0, 0);
    const { bgBuilder, content } = props;
    const dialogBodyWidth = this.getWidth();
    const dialogBodyHeight = this.getHeight();
    const bg = bgBuilder(dialogBodyWidth, dialogBodyHeight);
    this.align.anchor(bg).center(props.content);
    this.add([bg, content]);
    this.scene.add.existing(this);
    this.setOffScreen();
    this.background = bg;
    if (this.props.isAutoOpen) this.show();
  }

  show() {
    this.props.beforeOpen?.();
    this.showOverlay();
    this.scene.children.bringToTop(this);
    const animationDuration = this.props.animationDuration ?? 0;
    if (animationDuration > 0) this.showAnimated(animationDuration);
    else this.showInstant();
  }

  close() {
    const animationDuration = this.props.animationDuration ?? 0;
    if (animationDuration > 0) this.closeAnimated(animationDuration);
    else this.closeInstant();
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.hideOverlay();
    // иначе вызывается 2 раза
    // this.props.onClose?.();
  }

  protected getWidth() {
    const { width, padding = 16, content } = this.props;
    return width ?? content.getBounds().width + padding * 2;
  }

  protected getHeight() {
    const { height, padding = 16, content } = this.props;
    return height ?? content.getBounds().height + padding * 2;
  }

  protected closeAnimated(duration: number) {
    const { scene, props } = this;
    this.setOffScreen();
    const targetY = this.y;
    this.setOnScreen();

    scene.tweens.add({
      targets: this,
      props: {
        y: targetY,
      },
      duration,
      delay: 0,
      onComplete: () => {
        this.closeInstant();
      },
    });
  }

  protected closeInstant() {
    this.hideOverlay();
    this.setOffScreen();
    this.props.onClose?.();
  }

  protected setOffScreen() {
    const offset = 100;
    if (this.isOffScreen) return;
    this.isOffScreen = true;
    if (this.scene == null) return;
    this.align.anchorSceneScreen(this.scene).bottomTo(this, offset);
  }

  protected setOnScreen() {
    /** нет смысла блочить **/
    this.isOffScreen = false;
    this.align.anchorSceneScreen(this.scene).center(this);
  }

  get overlayAlpha() {
    return this.props.overlayAlpha ?? 0.46;
  }

  protected addOverlay() {
    const { scene, props, overlayAlpha } = this;
    const { overlayColor = "#000000", isCloseOnOverlayClick } = props;
    const overlay = new FullscreenOverlay({
      scene,
      color: cssColorToInt(overlayColor),
      alpha: overlayAlpha,
      interactive: true,
      manageHtmlOverlay: true,
    });
    if (isCloseOnOverlayClick) this.setOverlayCloseInteractive(overlay);

    return overlay;
  }

  protected setOverlayCloseInteractive(overlay: Phaser.GameObjects.Rectangle) {
    /** exclude clicks on body **/
    this.background.setInteractive();

    /** include clicks on overlay **/
    overlay
      .setInteractive({
        useHandCursor: true,
      })
      .once(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.close());
  }

  protected showOverlay() {
    const { scene } = this;
    this.overlay = this.addOverlay();
    new Align().anchorSceneScreen(scene).center(this.overlay);
    scene.add.existing(this.overlay);
  }

  protected hideOverlay() {
    this.overlay?.destroy();
  }

  protected showInstant() {
    this.setOnScreen();
  }

  protected showAnimated(duration: number) {
    const { scene } = this;
    /** fix target for animation **/
    this.setOnScreen();
    const targetY = this.y;

    /** move to offscreen **/
    this.setOffScreen();

    /** start animation **/
    scene.tweens.add({
      targets: this,
      props: {
        y: targetY,
      },
      duration,
      delay: 0,
    });
  }
}
