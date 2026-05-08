import {Align, AlignObject, cssColorToInt} from "@kvisaz/phaser-sugar";
import {FullscreenOverlay} from "./FullscreenOverlay";

type ChildObject = AlignObject & Phaser.GameObjects.GameObject;

export interface ICommonModalProps {
    content: ChildObject;
    beforeOpen?: () => void;
    onClose?: () => void;
    isAutoOpen?: boolean;
    overlayAlpha?: number;
    overlayColor?: string;
    animationDuration?: number;
    isCloseOnOverlayClick?: boolean;
}

/**
 * Общая модалка для любого content.
 * Управляет только оверлеем и анимацией, без фонового контейнера.
 * - при закрытии уничтожается
 * - можно закрыть отправкой события CommonModal.EVENT_CLOSE_COMMAND;
 */
export class CommonModal {
    static EVENT_CLOSE_COMMAND = 'modal.window.close';
    protected overlay: FullscreenOverlay | undefined;
    protected align: Align | undefined;

    constructor(protected props: ICommonModalProps) {
        const scene = this.props.content.scene;
        if (scene == null) return;
        this.props.content.scene?.events.once(CommonModal.EVENT_CLOSE_COMMAND, ({duration = 0} = {}) => this.close(duration));
        this.align = new Align();
        this.align.anchorSceneScreen(scene);
        this.setOffScreen();
        if (this.props.isAutoOpen) {
            this.show();
        }
    }

    show() {
        this.props.beforeOpen?.();
        this.showOverlay();
        this.scene.children.bringToTop(this.content);

        const animationDuration = this.props.animationDuration ?? 0;
        if (animationDuration > 0) {
            this.showAnimated(animationDuration);
            return;
        }

        this.showInstant();
    }

    close(duration = 0) {
        const animationDuration = this.props.animationDuration ?? duration;
        if (animationDuration > 0) {
            this.closeAnimated(animationDuration);
        } else {
            this.closeInstant();
        }
    }

    destroy(fromScene?: boolean) {
        this.hideOverlay();
    }

    protected get scene() {
        return this.content.scene;
    }

    protected get content() {
        return this.props.content;
    }

    protected get overlayAlpha() {
        return this.props.overlayAlpha ?? 0.46;
    }

    protected showOverlay() {
        const overlay = this.addOverlay();
        this.overlay = overlay;
        this.align?.center(overlay);
    }

    protected hideOverlay() {
        this.overlay?.destroy();
        this.overlay = undefined;
    }

    protected showInstant() {
        this.setOnScreen();
    }

    protected showAnimated(duration: number) {
        this.setOnScreen();
        const targetY = this.content.y;

        this.setOffScreen();

        this.scene.tweens.add({
            targets: this.content,
            props: {
                y: targetY,
            },
            duration,
            delay: 0,
        });
    }

    protected closeInstant() {
        this.hideOverlay();
        this.setOffScreen();
        this.props.onClose?.();
        this.destroy();
    }

    protected closeAnimated(duration: number) {
        this.setOffScreen();
        const targetY = this.content.y;
        this.setOnScreen();

        this.scene.tweens.add({
            targets: this.content,
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

    protected setOffScreen() {
        const offset = 100;
        this.align?.bottomTo(this.content, offset);
    }

    protected setOnScreen() {
        this.align?.center(this.content);
    }

    protected addOverlay() {
        const {overlayColor = "#000000", isCloseOnOverlayClick} = this.props;
        const overlay = new FullscreenOverlay({
            scene: this.scene,
            color: cssColorToInt(overlayColor),
            alpha: this.overlayAlpha,
            interactive: true,
            manageHtmlOverlay: true,
        });

        if (isCloseOnOverlayClick) {
            this.setOverlayCloseInteractive(overlay);
        }

        return overlay;
    }

    protected setOverlayCloseInteractive(overlay: Phaser.GameObjects.Rectangle) {
        overlay
            .setInteractive({
                useHandCursor: true,
            })
            .once(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.close());
    }
}
