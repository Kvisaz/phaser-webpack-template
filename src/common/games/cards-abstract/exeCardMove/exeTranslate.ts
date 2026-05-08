import { animateCardMove, layoutForAnimation } from "../CardAnimations/cardAnimations";
import { ICardTranslateAction } from "../index";

export async function exeTranslate(command: ICardTranslateAction): Promise<boolean> {
  const { card, fromStack, toStack, layoutFromDuration, moveDuration } = command;
  /** логика - убираем карты из исходного стека **/
  const cards = Array.isArray(card) ? card : [card];
  cards.forEach((card) => fromStack.removeCard(card));

  /** логика - вносим карты в другой стек на верхнее место **/
  toStack.placeCards(cards);

  /**  проводим лейаут для исходного стека **/
  const fromLayoutParams = layoutForAnimation({
    cards: fromStack.cards,
    layout: () => fromStack.layout(),
  });

  /** делаем лейаут для целевого стека запоминая разницу между позициями **/
  const moveParams = layoutForAnimation({
    cards,
    layout: () => toStack.layout(),
  });

  /** если не анимировано - финиш **/
  if (moveDuration == null || moveDuration === 0) return true;

  /** делаем анимацию на основе разницы **/
  await Promise.all([
    /** анимация полета карты в новый стек **/
    animateCardMove({
      moveParams,
      duration: moveDuration,
    }),
    /** анимация лейаута исходного стека - ему возможно надо восстановиться **/
    animateCardMove({
      moveParams: fromLayoutParams,
      duration: layoutFromDuration ?? 0,
    }),
  ]);

  return true;
}
