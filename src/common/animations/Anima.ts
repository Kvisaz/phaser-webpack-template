import { GameObject } from "../interfaces";
import { finishAnimation } from "./finishAnimation";

type AnimaTarget =
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Shape
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.NineSlice
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Ellipse
  | Phaser.GameObjects.TileSprite;

type Fn = () => void;

/**
 * коллекция готовых шаблонов анимации
 * - каждый шаблон анимации ЗАКАНЧИВАЕТ любые предыдущии анимации объекта
 * - в onComplete для каждого tween ставь восстанавливающие вещи, если это имеет смысл
 * **/
export class Anima {
  /** покачивает объект из стороны в сторону **/
  static shakeNegative(args: {
    target: AnimaTarget;
    amplitude?: number;
    duration?: number;
    onComplete?: Fn;
  }) {
    const { target, amplitude = 5, duration = 300, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);
    const startX = target.x;

    scene.tweens.add({
      targets: target,
      props: {
        x: startX - amplitude,
      },
      duration: duration / 4,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        target.x = startX + amplitude;
      },
      onComplete: () => {
        target.x = startX;
        onComplete?.();
      },
    });
  }

  /** трясет объект вверх-вниз **/
  static shakeLootBox(args: {
    target: AnimaTarget;
    amplitude?: number;
    delay?: number;
    duration?: number;
    onComplete?: Fn;
  }) {
    const { target, amplitude = 12, duration = 500, delay, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);

    const startY = target.y;

    const offsetY = Math.abs(amplitude);
    const repeat = 3;

    scene.tweens.add({
      targets: target,
      props: {
        y: startY + offsetY,
      },
      yoyo: true,
      repeat,
      delay,
      // yoyo удваивает длительность
      duration: duration / (repeat * 2),
      onStart: () => {
        target.y = startY - offsetY;
      },
      onComplete: () => {
        target.y = startY;
        onComplete?.();
      },
    });
  }

  static popItem(params: {
    target: GameObject;
    upDistance?: number;
    scaleAmount?: number;
    duration?: number;
    repeat?: number;
    onComplete?: () => void;
  }) {
    const {
      target,
      scaleAmount = 1.08,
      duration = 400,
      repeat = 0,
      onComplete,
      upDistance = 0,
    } = params;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }
    finishAnimation(target);

    const originalScaleX = target.scaleX;
    const originalScaleY = target.scaleY;
    const originalY = target.y;

    scene.tweens.add({
      targets: target,
      props: {
        y: originalY + upDistance,
        scaleX: originalScaleX * scaleAmount,
        scaleY: originalScaleY * scaleAmount,
      },
      yoyo: true,
      // yoyo удваивает, repeat добавляет ещё циклы
      duration: Math.max(1, duration / ((repeat + 1) * 2)),
      repeat,
      ease: Phaser.Math.Easing.Back.Out,
      onComplete: () => {
        target.y = originalY;
        target.scaleX = originalScaleX;
        target.scaleY = originalScaleY;
        onComplete?.();
      },
    });
  }

  /** плавно проявляет объект **/
  static fadeIn(args: {
    target: AnimaTarget;
    duration?: number;
    delay?: number;
    fromAlpha?: number;
    onComplete?: Fn;
  }) {
    const { target, duration = 250, delay, fromAlpha = 0, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);
    const finalAlpha = target.alpha;

    scene.tweens.add({
      targets: target,
      alpha: finalAlpha,
      delay,
      duration,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onStart: () => {
        target.alpha = fromAlpha;
      },
      onComplete: () => {
        target.alpha = finalAlpha;
        onComplete?.();
      },
    });
  }

  /** плавно скрывает объект **/
  static fadeOut(args: {
    target: AnimaTarget;
    duration?: number;
    delay?: number;
    toAlpha?: number;
    destroyOnComplete?: boolean;
    onComplete?: Fn;
  }) {
    const { target, duration = 200, delay, toAlpha = 0, destroyOnComplete, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);

    scene.tweens.add({
      targets: target,
      alpha: toAlpha,
      delay,
      duration,
      ease: Phaser.Math.Easing.Quadratic.In,
      onComplete: () => {
        target.alpha = toAlpha;
        if (destroyOnComplete) {
          target.destroy();
        }
        onComplete?.();
      },
    });
  }

  /** пульс масштаба на пару повторов **/
  static pulseScale(args: {
    target: AnimaTarget;
    scaleAmount?: number;
    duration?: number;
    repeat?: number;
    delay?: number;
    onComplete?: Fn;
  }) {
    const { target, scaleAmount = 1.1, duration = 350, repeat = 1, delay, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);
    const baseScaleX = target.scaleX;
    const baseScaleY = target.scaleY;
    const repeatCount = Math.max(0, repeat - 1);

    scene.tweens.add({
      targets: target,
      props: {
        scaleX: baseScaleX * scaleAmount,
        scaleY: baseScaleY * scaleAmount,
      },
      yoyo: true,
      repeat: repeatCount,
      delay,
      duration: duration / 2,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete: () => {
        target.scaleX = baseScaleX;
        target.scaleY = baseScaleY;
        onComplete?.();
      },
    });
  }

  /** легкое покачивание по оси Y **/
  static hoverY(args: {
    target: AnimaTarget;
    amplitude?: number;
    duration?: number;
    repeat?: number;
    delay?: number;
    onComplete?: Fn;
  }) {
    const { target, amplitude = 6, duration = 1200, repeat = 2, delay, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);
    const startY = target.y;
    const offsetY = Math.abs(amplitude);
    const repeatCount = Math.max(0, repeat - 1);

    scene.tweens.add({
      targets: target,
      props: {
        y: startY - offsetY,
      },
      yoyo: true,
      repeat: repeatCount,
      delay,
      duration: duration / 2,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete: () => {
        target.y = startY;
        onComplete?.();
      },
    });
  }

  /** быстрый поворот на N оборотов с возвратом исходного угла **/
  static spin(args: {
    target: AnimaTarget;
    turns?: number;
    duration?: number;
    delay?: number;
    onComplete?: Fn;
  }) {
    const { target, turns = 1, duration = 400, delay, onComplete } = args;
    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    finishAnimation(target);
    const startAngle = target.angle;

    scene.tweens.add({
      targets: target,
      angle: startAngle + 360 * turns,
      duration,
      delay,
      ease: Phaser.Math.Easing.Cubic.Out,
      onComplete: () => {
        target.angle = startAngle;
        onComplete?.();
      },
    });
  }
}
