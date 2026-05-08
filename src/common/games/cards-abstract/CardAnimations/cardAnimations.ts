/**
 * Этот файл содержит функции для анимации карт.
 * Функции должны быть абстрактными и не зависеть от конкретной реализации карт или логики игры.
 * Это позволит легко переиспользовать их в различных карточных играх.
 * В идеале они должны получать только стартовые и финишные параметра
 * то есть разницу до и после layout
 */
import { CardSide, IAbstractCard } from "../abstract_types";
import { Anima } from "../../../animations";
import { GameObject } from "../../../interfaces";

/**
 * Расширенный интерфейс карты для анимации.
 */
interface IAnimatedCard extends IAbstractCard, Phaser.GameObjects.GameObject {
  isFaceUp: boolean;
  scaleX: number;
  scaleY: number;

  flip(side: CardSide): void;
}

interface IGetStartFinishParams {
  cards: IAnimatedCard[];
  /** функция которая вызывается для вычисления финишных параметров **/
  layout: () => void;
}

type Position = { x: number; y: number };

export interface IMoveParams {
  target: IAnimatedCard;
  startPosition: Position;
  finishPosition: Position;
}

/** Исполняет layout и возвращает массив параметров для всех объектов
 * с начальными и финишными параметрами после layout
 * - эти параметры можно тут же зарядить в tweens и получить анимацию
 * , если сразу вернуть стартовые позиции с помощью @restoreStartPositions
 * **/
export function layoutForAnimation({ cards, layout }: IGetStartFinishParams): IMoveParams[] {
  const params: IMoveParams[] = cards.map((card) => ({
    target: card,
    startPosition: { x: card.x, y: card.y },
    finishPosition: { x: card.x, y: card.y },
  }));
  layout();
  params.forEach((param) => {
    param.finishPosition.x = param.target.x;
    param.finishPosition.y = param.target.y;
  });
  return params;
}

/** восстановить стартовые позиции для лейута - подготовка к анимации
 * **/
export function restoreStartPositions(params: IMoveParams[]): void {
  params.forEach((param) => {
    param.target.x = param.startPosition.x;
    param.target.y = param.startPosition.y;
  });
}

interface IAnimateMoveParams {
  moveParams: IMoveParams[];
  duration?: number;
  onComplete?: () => void;
}

/**
 * Анимирует полет одной или нескольких карт в указанную стопку.
 * Карты перемещаются из их текущего положения в положение, которое они займут в новой стопке.
 * @param params - параметры анимации.
 */
export async function animateCardMove({
  moveParams,
  duration = 300,
}: IAnimateMoveParams): Promise<void> {
  if (moveParams.length === 0) {
    return;
  }
  restoreStartPositions(moveParams);
  const scene = moveParams[0].target.scene;

  return new Promise<void>((resolve) => {
    let completedCount = 0;
    const SIZE = moveParams.length;

    moveParams.forEach((moveParams, index) => {
      scene.tweens.add({
        targets: moveParams.target,
        x: moveParams.finishPosition.x,
        y: moveParams.finishPosition.y,
        duration,
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          completedCount++;
          if (completedCount === SIZE) {
            resolve();
          }
        },
      });
    });
  });
}

/**
 * Параметры для анимации переворачивания карты.
 */
interface AnimateCardFlipParams {
  card: IAnimatedCard | undefined;
  flipTo?: CardSide;
  duration?: number;
  delay?: number;
}

/**
 * Анимирует переворачивание карты.
 * Анимация состоит из двух частей: сначала карта сжимается по горизонтали до нуля,
 * затем происходит ее переворот (меняется текстура) и она разжимается обратно до исходного размера.
 * @param params - параметры анимации.
 */
export async function animateCardFlip(params: AnimateCardFlipParams): Promise<void> {
  const { card, flipTo = "face", duration = 150, delay = 0 } = params;
  if (!card) return Promise.resolve();

  const isFlipped = flipTo === "face" ? card.isFaceUp : !card.isFaceUp;
  if (isFlipped) return Promise.resolve();

  const scene = card.scene;

  const halfDuration = duration / 2;
  const originalScaleX = card.scaleX;

  return new Promise<void>((resolve) => {
    scene.tweens.add({
      targets: card,
      scaleX: 0,
      duration: halfDuration,
      delay,
      ease: "Power2",
      onComplete: () => {
        card.flip(flipTo);

        scene.tweens.add({
          targets: card,
          scaleX: originalScaleX,
          duration: halfDuration,
          ease: Phaser.Math.Easing.Sine.InOut,
          onComplete: () => {
            resolve();
          },
        });
      },
    });
  });
}

interface AnimateCardShakeParams {
  card: IAnimatedCard | undefined;
  amplitude?: number;
  duration?: number;
}

export async function animateCardShake(params: AnimateCardShakeParams): Promise<void> {
  const { card, amplitude = 5, duration = 300 } = params;
  if (!card) return Promise.resolve();

  const scene = card.scene;
  const originalX = card.x;

  return new Promise<void>((resolve) => {
    scene.tweens.add({
      targets: card,
      x: originalX - amplitude,
      duration: duration / 4,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        card.x = originalX + amplitude;
      },
      onComplete: () => {
        card.x = originalX;
        resolve();
      },
    });
  });
}

interface AnimateCardPopParams {
  card: GameObject;
  scaleAmount?: number;
  duration?: number;
  repeat?: number;
}

export async function animateCardPop(params: AnimateCardPopParams): Promise<void> {
  const { card, scaleAmount = 1.08, duration = 400, repeat } = params;
  if (!card) return Promise.resolve();

  return new Promise<void>((resolve) => {
    Anima.popItem({
      target: card,
      scaleAmount,
      duration,
      repeat,
      upDistance: -8,
      onComplete: resolve,
    });
  });
}
