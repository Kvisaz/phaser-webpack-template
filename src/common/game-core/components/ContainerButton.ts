import { AlignObject } from "@kvisaz/phaser-sugar";

export interface IButtonOptions {
  once: boolean;
  clickMode: "down" | "up";
  overMoveY: number;
  onDisabled?: (button: ContainerButton) => void;
  onEnabled?: (button: ContainerButton) => void;
  disableAfterClick: {
    ms: number;
  };
}

export type ButtonChild = Phaser.GameObjects.GameObject & {
  postFX?: Phaser.GameObjects.Components.FX;
} & AlignObject;

export const defaultOptions: IButtonOptions = {
  clickMode: "up",
  overMoveY: 6,
  once: true,
  disableAfterClick: { ms: 0 },
} as const;

export interface IContainerButtonProps {
  gameObjects: ButtonChild[];
  onClick: () => void;
  onOver?: () => void;
  onOut?: () => void;
  options?: Partial<IButtonOptions>;
}

/**
 * Кнопка-контейнер - просто добавь объекты
 * фоном считается первый объект в списке!
 * **/
export class ContainerButton extends Phaser.GameObjects.Container {
  protected options: IButtonOptions;

  protected isClickDisabled = false;
  protected isOverEffect = false;
  private hoverBaseScale = {
    x: 1,
    y: 1,
  };

  get background() {
    return this.props.gameObjects[0];
  }

  get isEnabled() {
    return !this.isClickDisabled;
  }

  protected pressEffectState = {
    isChanged: false,
    offsetY: 0,
  };
  // press-сдвиг применяем к детям, а не к контейнеру — чтобы не конфликтовать с внешними tween'ами контейнера.

  protected onOutHandler = () => {
    this.clearPressEffect();
    this.clearOverEffect();
  };

  constructor(private readonly props: IContainerButtonProps) {
    super(props.gameObjects[0].scene, 0, 0, props.gameObjects);
    this.options = {
      ...defaultOptions,
      ...props.options,
      disableAfterClick: {
        ...defaultOptions.disableAfterClick,
        ...props.options?.disableAfterClick,
      },
    };
    this.scene.add.existing(this);

    this.bindPointerEvents();
    this.bindGlobalOut();
    this.updateInteractiveZone();
  }

  updateInteractiveZone() {
    this.disableInteractive();
    const bounds = this.getBounds();
    this.setSize(bounds.width, bounds.height);
    this.setInteractive({
      useHandCursor: true,
    });
  }

  /** Публичный метод включения/выключения клика */
  public enable(enabled = true) {
    this.isClickDisabled = !enabled;
    if (this.scene == null) return;
    if (enabled) {
      this.options.onEnabled?.(this);
      this.updateInteractiveZone();
    } else {
      this.disableInteractive();
      this.options.onDisabled?.(this);
      this.delayedCall(() => {
        this.clearOverEffect();
        this.clearPressEffect();
      }, 1);
    }
  }

  // ----------------- protected helpers -----------------

  protected delayedCall(callback: () => void, ms: number) {
    const { scene } = this;
    scene?.time.delayedCall(ms, () => {
      if (!this.scene) return;
      callback();
    });
  }

  protected buttonClick() {
    if (this.isClickDisabled) return;

    this.props.onClick();

    if (this.options.once) {
      this.enable(false);
    } else if (this.options.disableAfterClick.ms > 0) {
      this.enable(false);
      this.delayedCall(() => this.enable(true), this.options.disableAfterClick.ms);
    }
  }

  protected addPressEffect() {
    if (this.pressEffectState.isChanged) return;
    this.pressEffectState.isChanged = true;
    this.pressEffectState.offsetY = this.options.overMoveY ?? 0;
    if (this.pressEffectState.offsetY !== 0) {
      // Смещаем детей, не контейнер — так внешние анимации контейнера не ломаются.
      this.shiftChildrenY(this.pressEffectState.offsetY);
    }
  }

  protected clearPressEffect() {
    if (!this.pressEffectState.isChanged) return;
    this.pressEffectState.isChanged = false;
    if (this.pressEffectState.offsetY !== 0) {
      this.shiftChildrenY(-this.pressEffectState.offsetY);
      this.pressEffectState.offsetY = 0;
    }
  }

  private shiftChildrenY(delta: number) {
    // Контейнер оставляем на месте; сдвигаем содержимое, чтобы не сбивать внешние анимации контейнера.
    this.list.forEach((child) => {
      if (!child || typeof (child as any).y !== "number") return;
      (child as any).y += delta;
    });
  }

  protected addOverEffect() {
    if (this.isOverEffect) return;
    this.isOverEffect = true;
    this.hoverBaseScale = {
      x: this.scaleX,
      y: this.scaleY,
    };
    this.setScale(this.hoverBaseScale.x * 1.05, this.hoverBaseScale.y * 1.05);
  }

  protected clearOverEffect() {
    if (!this.isOverEffect) return;
    this.isOverEffect = false;
    this.setScale(this.hoverBaseScale.x, this.hoverBaseScale.y);
  }

  protected bindPointerEvents() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      if (this.isClickDisabled) return;
      this.props.onOver?.();
      this.addOverEffect();
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      if (this.isClickDisabled) return;
      this.props.onOut?.();
      this.clearOverEffect();
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      if (this.isClickDisabled) return;
      this.clearOverEffect();
      this.addPressEffect();
      if (this.options.clickMode === "down") this.buttonClick();
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (this.isClickDisabled) return;
      if (this.options.clickMode === "up") this.buttonClick();
      this.addOverEffect();
      this.clearPressEffect();
    });

    // Очистка хендлеров при уничтожении
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene?.input.off(Phaser.Input.Events.GAME_OUT, this.onOutHandler);
      this.removeAllListeners?.();
    });
  }

  protected bindGlobalOut() {
    this.scene.input.on(Phaser.Input.Events.GAME_OUT, this.onOutHandler);
  }
}
