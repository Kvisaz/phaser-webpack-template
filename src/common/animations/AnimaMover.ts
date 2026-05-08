type MoverTarget =
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
 * Набор утилит, которые МЕНЯЮТ положение объекта (в отличие от Anima).
 * Подходит для анимаций перелёта/перемещения (например, монетки летят к цели).
 * Внимание - не останавливает предыдущие анимации
 */
export class AnimaMover {
  /** плавный полет объекта к целевой точке **/
  static flyTo(args: {
    target: MoverTarget;
    targetX: number;
    targetY: number;
    duration?: number;
    delay?: number;
    ease?: (v: number) => number;
    onComplete?: Fn;
  }) {
    const {
      target,
      targetX,
      targetY,
      duration = 700,
      delay,
      ease = Phaser.Math.Easing.Cubic.InOut,
      onComplete,
    } = args;

    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    scene.tweens.add({
      targets: target,
      x: targetX,
      y: targetY,
      duration,
      delay,
      ease,
      onComplete: () => {
        target.x = targetX;
        target.y = targetY;
        onComplete?.();
      },
    });
  }

  /** небольшой "взрыв": разлёт группы объектов в разные стороны **/
  static explode(args: {
    targets: MoverTarget[];
    delay?: number;
    duration?: number;
    angleStart?: number;
    angleEnd?: number;
    distance?: number;
    distanceDisperce?: number;
    ease?: (v: number) => number;
    onComplete?: Fn;
  }) {
    const {
      targets,
      delay = 0,
      duration = 250,
      angleStart = 0,
      angleEnd = 360,
      distance = 120,
      distanceDisperce = 0.7,
      ease = Phaser.Math.Easing.Cubic.Out,
      onComplete,
    } = args;

    if (targets.length === 0) {
      onComplete?.();
      return;
    }

    const scene = targets[0].scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    const baseX = targets[0].x;
    const baseY = targets[0].y;

    let completed = 0;
    const total = targets.length;

    const completeOne = () => {
      completed += 1;
      if (completed >= total) {
        onComplete?.();
      }
    };

    const count = targets.length;
    const angleRange = angleEnd - angleStart;
    const angles: number[] = [];

    // Готовим уникальные углы на каждый вызов, чтобы разлет не совпадал между кликами.
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / count : 0;
      const baseAngle = count > 1 ? angleStart + angleRange * t : (angleStart + angleEnd) / 2;
      const jitter = Phaser.Math.FloatBetween(-angleRange / (count * 2), angleRange / (count * 2));
      angles.push(baseAngle + jitter);
    }

    Phaser.Utils.Array.Shuffle(angles);

    targets.forEach((target, index) => {
      const angleDeg = angles[index] ?? (angleStart + angleEnd) / 2;
      const angleRad = Phaser.Math.DegToRad(angleDeg);
      const delta =
        distance +
        Phaser.Math.FloatBetween(-distance * distanceDisperce, distance * distanceDisperce);
      const dist = Math.max(0, delta);
      const offsetX = Math.cos(angleRad) * dist;
      const offsetY = Math.sin(angleRad) * dist;

      scene.tweens.add({
        targets: target,
        x: baseX + offsetX,
        y: baseY + offsetY,
        delay,
        duration,
        ease,
        onComplete: () => {
          target.x = baseX + offsetX;
          target.y = baseY + offsetY;
          completeOne();
        },
      });
    });
  }

  /** полет по дуге (квадратный Bezier), можно задать высоту дуги **/
  static flyArc(args: {
    target: MoverTarget;
    targetX: number;
    targetY: number;
    arcHeight?: number;
    duration?: number;
    delay?: number;
    ease?: (v: number) => number;
    onComplete?: Fn;
  }) {
    const {
      target,
      targetX,
      targetY,
      arcHeight = -120,
      duration = 700,
      delay,
      ease = Phaser.Math.Easing.Quadratic.InOut,
      onComplete,
    } = args;

    const scene = target.scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    const startX = target.x;
    const startY = target.y;
    const controlX = (startX + targetX) / 2;
    const controlY = Math.min(startY, targetY) + arcHeight; // arcHeight < 0 даёт подъём

    // Используем addCounter, чтобы получить параметр t от 0 до 1 и вручную
    // строить координаты по bezier. Это удобнее, чем анимировать x/y отдельными tween'ами,
    // когда нужна связанная траектория, и надёжнее, чем таймеры/delayedCall —
    // здесь попадаем в общий Tween Manager, получаем правильный pause/scale/time dilation.
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      delay,
      ease,
      onUpdate: (tween) => {
        const t = tween.getValue();
        if (t == null) return;
        const x = Phaser.Math.Interpolation.QuadraticBezier(t, startX, controlX, targetX);
        const y = Phaser.Math.Interpolation.QuadraticBezier(t, startY, controlY, targetY);
        target.x = x;
        target.y = y;
      },
      onComplete: () => {
        target.x = targetX;
        target.y = targetY;
        onComplete?.();
      },
    });
  }

  /** гравитационный спуск: ускорение падения с финальным приземлением **/
  static gravitation(args: {
    targets: MoverTarget[];
    gravity?: number;
    startVelocityY?: number;
    duration?: number;
    delay?: number;
    onComplete?: Fn;
  }) {
    const {
      targets,
      gravity = 1200, // пиксели/сек^2
      startVelocityY = 0,
      duration = 700,
      delay = 0,
      onComplete,
    } = args;

    if (targets.length === 0) {
      onComplete?.();
      return;
    }

    const scene = targets[0].scene;
    if (scene == null) {
      onComplete?.();
      return;
    }

    // Сохраняем стартовые позиции
    const startPositions = targets.map((t) => ({ x: t.x, y: t.y }));

    let completed = 0;
    const total = targets.length;
    const completeOne = () => {
      completed += 1;
      if (completed >= total) onComplete?.();
    };

    targets.forEach((target, index) => {
      const startY = startPositions[index].y;
      const startX = startPositions[index].x;

      // addCounter даёт Tween со значением "t" (секунды), к которому можно привязать формулу падения,
      // в отличие от таймеров/delayedCall — он следует общим настройкам timeScale/pause и живёт в Tween Manager.
      scene.tweens.addCounter({
        from: 0,
        to: duration / 1000, // секунды
        duration,
        delay,
        ease: Phaser.Math.Easing.Linear,
        onUpdate: (tween) => {
          const t = tween.getValue(); // секунды
          if (t == null) return;
          const y = startY + startVelocityY * t + 0.5 * gravity * t * t;
          target.y = y;
          target.x = startX; // не меняем X, чисто вертикальное падение
        },
        onComplete: () => {
          completeOne();
        },
      });
    });
  }
}
