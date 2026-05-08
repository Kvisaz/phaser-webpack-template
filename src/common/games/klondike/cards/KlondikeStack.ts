import { IKlondikeCard, IKlondikeStack, KlondikeStackType } from "../types";
import { ICardPlace, ILayoutStrategy } from "../../cards-abstract";
import { ArrangeOrder, arrangeOrder } from "../../../gameObjects";
import { insertInArray } from "../../../collections";

interface IKlondikeCardStackProps {
  id: string;
  type: KlondikeStackType;
  /** Где лежат карты **/
  cardPlace: ICardPlace;
  /** как карты раскладываются на визуальном месте **/
  layoutStrategy: ILayoutStrategy;
  /** начальный сетап карт **/
  cards?: IKlondikeCard[];
}

export class KlondikeStack implements IKlondikeStack {
  readonly cardPlace: ICardPlace;
  readonly cards: IKlondikeCard[];
  readonly id: string;
  readonly type: KlondikeStackType;

  constructor(private props: IKlondikeCardStackProps) {
    this.id = props.id;
    this.type = props.type;
    this.cardPlace = this.props.cardPlace;
    this.cards = this.props.cards != null ? [...this.props.cards] : [];
    this.setStackDataToAll();
    // this.layout();
  }

  get topCard(): IKlondikeCard | undefined {
    return this.cards[this.cards.length - 1];
  }

  get length() {
    return this.cards.length;
  }

  getBounds(): Phaser.Geom.Rectangle {
    return this.cardPlace.getBounds();
  }

  layout() {
    this.props.layoutStrategy(this.cards, this.cardPlace);
  }

  clear() {
    this.cards.length = 0;
  }

  /** Забирает карту из стопки **/
  pickTopCard(): IKlondikeCard | undefined {
    return this.cards.pop();
  }

  /** Помещает все карты на верх стопки **/
  placeCards(cards: IKlondikeCard | IKlondikeCard[], atIndex?: number) {
    const isArray = Array.isArray(cards);
    const length = isArray ? cards.length : 1;
    if (length === 0) return;

    insertInArray(this.cards, cards, atIndex);
    this.setStackDataToAll();

    // приводим z-index в соответствии с порядком в стеке
    this.cards.forEach((card) => arrangeOrder(card, ArrangeOrder.top));

    // layout контролируется внешне
    // this.layout();
  }

  removeCard(card: IKlondikeCard) {
    const index = this.cards.indexOf(card);
    if (index === -1) return;
    this.cards.splice(index, 1);
    // предполагается что стек у карты поменяется при входе в другой стек
    // главное почистить массив стека
    // this.resetStackData(card);

    // лейаут теперь всегда контролируется внешне
    // this.layout();
  }

  /** перемещает как в колоду - восстанавливая порядок и переворачивая карты **/
  moveAsToDeck(stack: IKlondikeStack) {
    const cards = [...this.cards].reverse();
    this.cards.length = 0;
    stack.placeCards(cards);
    cards.forEach((card) => card.flip("back"));
  }

  private setStackData(card: IKlondikeCard) {
    card.stackId = this.id;
  }

  private setStackDataToAll() {
    this.cards.forEach((card) => {
      this.setStackData(card);
    });
  }
}
