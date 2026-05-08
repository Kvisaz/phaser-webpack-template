import { ISpiderCard, ISpiderStack, SpiderStackType } from "../types";
import { ICardPlace, ILayoutStrategy } from "../../cards-abstract";
import { ArrangeOrder, arrangeOrder } from "../../../gameObjects";
import { insertInArray } from "../../../collections";

interface ISpiderStackProps {
  id: string;
  type: SpiderStackType;
  cardPlace: ICardPlace;
  layoutStrategy: ILayoutStrategy;
  cards?: ISpiderCard[];
}

export class SpiderStack implements ISpiderStack {
  readonly cardPlace: ICardPlace;
  readonly cards: ISpiderCard[];
  readonly id: string;
  readonly type: SpiderStackType;

  constructor(private props: ISpiderStackProps) {
    this.id = props.id;
    this.type = props.type;
    this.cardPlace = this.props.cardPlace;
    this.cards = this.props.cards != null ? [...this.props.cards] : [];
    this.setStackDataToAll();
  }

  get topCard(): ISpiderCard | undefined {
    return this.cards[this.cards.length - 1];
  }

  get length() {
    return this.cards.length;
  }

  getBounds(): Phaser.Geom.Rectangle {
    const baseBounds = this.cardPlace.getBounds();

    const topCardBounds = this.topCard?.getBounds();
    if (!topCardBounds) return baseBounds;

    return Phaser.Geom.Rectangle.Union(baseBounds, topCardBounds);
  }

  layout() {
    this.props.layoutStrategy(this.cards, this.cardPlace);
  }

  clear() {
    this.cards.length = 0;
  }

  pickTopCard(): ISpiderCard | undefined {
    return this.cards.pop();
  }

  placeCards(cards: ISpiderCard | ISpiderCard[], atIndex?: number) {
    const isArray = Array.isArray(cards);
    const length = isArray ? cards.length : 1;
    if (length === 0) return;

    insertInArray(this.cards, cards, atIndex);
    this.setStackDataToAll();

    this.cards.forEach((card) => arrangeOrder(card, ArrangeOrder.top));
  }

  removeCard(card: ISpiderCard) {
    const index = this.cards.indexOf(card);
    if (index === -1) return;
    this.cards.splice(index, 1);
  }

  moveAsToDeck(stack: ISpiderStack) {
    const cards = [...this.cards].reverse();
    this.cards.length = 0;
    stack.placeCards(cards);
    cards.forEach((card) => card.flip("back"));
  }

  private setStackData(card: ISpiderCard) {
    card.stackId = this.id;
  }

  private setStackDataToAll() {
    this.cards.forEach((card) => {
      this.setStackData(card);
    });
  }
}
