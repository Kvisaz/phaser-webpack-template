import { InstantFlipResult, InstantTransferResult } from "../instant/types";
import { layoutForAnimation } from "../../../../cards-abstract/CardAnimations/cardAnimations";
import {CardTransferMove, FlipMove} from '../../../index';

/**
 *  Мгновенный трансфер карточки на новый стек
 *  выполняется лейаут
 * возвращает начальное и конечное состояние
 * которые можно использовать для анимации
 **/
export function runInstantTransfer(step: CardTransferMove): InstantTransferResult {
  const { cards, from, to } = step;
  /** исполняем логику  **/
  if (Array.isArray(cards)) {
    cards.forEach((card) => from.removeCard(card));
    to.placeCards(cards);
  } else {
    const card = cards;
    from.removeCard(card);
    to.placeCards(card);
  }

  /**  проводим лейаут для исходного стека **/
  const fromLayoutParams = layoutForAnimation({
    cards: from.cards,
    layout: () => from.layout(),
  });

  /** делаем лейаут для целевого стека запоминая разницу между позициями **/
  const moveParams = layoutForAnimation({
    cards: Array.isArray(cards) ? cards : [cards],
    layout: () => to.layout(),
  });

  return {
    ...step,
    fromLayoutParams,
    moveParams,
  };
}

/**
 * мгновенный флип карты
 * возвращает начальное и конечное состояние
 * которые можно использовать для анимации
 **/
export function runFlipLogic(step: FlipMove): InstantFlipResult {
  const { cards, to } = step;
  /** исполняем логику и визуал одновременно  **/
  if (Array.isArray(cards)) {
    cards.forEach((card) => card.flip(to.side));
  } else {
    const card = cards;
    card.flip(to.side);
  }
  return { ...step };
}
