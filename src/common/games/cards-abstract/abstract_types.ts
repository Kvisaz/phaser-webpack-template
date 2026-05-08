import { AlignObject, IBoundable } from "@kvisaz/phaser-sugar";

export type ICardPlace = Phaser.GameObjects.GameObject & AlignObject;

export interface IScalable {
  scaleX: number;
  scaleY: number;

  setScale(x: number, y?: number): this;
}

export type ILayoutStrategy<T extends Record<string, unknown> = {}> = (
  items: AlignObject[],
  inputZone: IBoundable,
  options?: T,
) => void;

export type CardSide = "face" | "back";

export interface IAbstractCard
  extends Phaser.GameObjects.GameObject,
    AlignObject,
    IBoundable,
    IScalable {
  side: CardSide;

  flip(to?: CardSide): void;

  isFaceUp: boolean;

  /** каждая карта принадлежит какому-то стеку, стопке, месту **/
  stackId: string;
}

/** to do абстрактный стек для любый карточек **/
export interface ICardStack<Card extends IAbstractCard = IAbstractCard> extends IBoundable {
  id: string;
  type: string;
  // карточки - основной интерактивный элемент
  cards: Card[];
  // игровой объекто - место для карт,  можно для инпута временного
  cardPlace: ICardPlace;
  topCard: Card | undefined;
  length: number;

  placeCards(cards: Card | Card[], atIndex?: number): void;

  moveAsToDeck(stack: ICardStack<Card>): void;

  /** Забирает карту из стопки **/
  pickTopCard(): Card | undefined;

  removeCard(card: Card): void;

  /** производит мгновенное размещение карточек с нужными позициями на своем месте **/
  layout(): void;

  /** убирает все карты **/
  clear(): void;
}

/**  функция раздачи карт с изменением стопок и анимациями **/
export type CardsMoveDealer<T extends object = object> = (
  deck: ICardStack,
  piles: ICardStack[],
  options?: T,
) => Promise<void>;
