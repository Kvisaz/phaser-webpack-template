import { CardSide, IAbstractCard, ICardStack } from "../../../cards-abstract";

export type Card = IAbstractCard;
type Stack = ICardStack;

interface IAbstractMove<TState extends {}> {
  type: string;
  cards: Card | Card[];
  from: TState;
  to: TState;
}

export interface CardTransferMove extends IAbstractMove<Stack> {
  type: "cardTransfer";
}

export type FlipState = { side: CardSide };

export interface FlipMove extends IAbstractMove<FlipState> {
  type: "flip";
}

/**
 *  Элементарный атом изменения состояния в карточной игре
 **/
export type TransferFlipCardsMoveStep = CardTransferMove | FlipMove;

/**
 * Ход в карточной игре - группирует разные эффекты
 */
export type TransferFlipCardsMove = {
  /** исполняются всегда последовательно **/
  steps: TransferFlipCardsMoveStep[];
};

/**  хранитель истории конкретного игрока, обработчик его ходов.
 * Не знает о cardStackMap -
 * потому что в абстракции хода есть только карта и целевая стопка, или новое состояние карты
 *  - но меняет состояние стопок!**/
export interface IHistoryTransferFlipMover {
  /** исполняет выданный ход и засовывает его в историю **/
  do(move: TransferFlipCardsMove): Promise<void>;

  /** извлекает последний ход из истории и отменяет его,
   * возвращая для обработки **/
  undoLastMove(): Promise<TransferFlipCardsMove>;

  /** длина истории **/
  historyLength: number;
  isUndoAllowed: boolean;
}
