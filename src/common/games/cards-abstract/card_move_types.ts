import { CardSide, IAbstractCard, ICardStack } from "./abstract_types";

/** Здесь только чистая логика, никакого вью **/

/**
 * Ход в картах - возможна цепочка перeмещений и флипов
 * хотя чаще перемещение + опциональный флип в разном порядке
 * **/
export type CardMove = CardMovePart[];

export type CardMovePart = ICardTranslateAction | ICardFlipAction;

export enum CardActionType {
  move = "move",
  flip = "flip",
}

/** перемещаем  карты  **/
export interface ICardTranslateAction {
  type: CardActionType.move;
  card: IAbstractCard | IAbstractCard[];
  fromStack: ICardStack<IAbstractCard>;
  toStack: ICardStack<IAbstractCard>;
  /** анимация лейаута исходного после изменения **/
  layoutFromDuration?: number;
  /** перемещение карт **/
  moveDuration?: number;
}

/** переворачиваем  карты  **/
export interface ICardFlipAction {
  type: CardActionType.flip;
  card: IAbstractCard | IAbstractCard[];
  side: CardSide;
  duration?: number;
}
