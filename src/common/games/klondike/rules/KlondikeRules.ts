import { CardSuit, CardValue } from "../../cards-classic";
import { IKlondikeCard, IKlondikeStack, IKlondikeStackMap, KlondikeStackType } from "../types";

interface IKlondikeRulesProps {
  stackMap: IKlondikeStackMap;
}

/**
 * справочный центр,
 * который определяет, какие ходы доступны игроку,
 * какие подсказки и трюки он может использовать
 * выдает "ход игрока", если возможен
 *
 * описывается и реализуется для конкретной игры
 * **/
export class KlondikeRules {
  public readonly BASE_AMOUNT = 4;
  public readonly PILES_AMOUNT = 7;
  public readonly SUITS_AMOUNT = 4;

  private readonly valueOrder: CardValue[] = [
    "ace",
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    "jack",
    "queen",
    "king",
  ];

  constructor(private readonly props: IKlondikeRulesProps) {}

  /** получить карты,
   * которые допустимо перетаскивать стопкой при клике на карте (только для PILE)
   * отсчет идет вверх
   * для отсчета вниз - KlondikeTricks.getMovableChains
   * */
  public getPileMovableCards(card: IKlondikeCard): IKlondikeCard[] {
    const { stackMap } = this.props;
    const stack = stackMap.get(card.stackId);

    // 1) запрет на другой тип стопки и проверка нулевой длины
    if (stack == null || stack.type !== KlondikeStackType.PILE || stack.cards.length === 0)
      return [];

    // 2) По правилам Косынки перетаскивать можно только открытую карту (и открытую цепочку над ней)
    if (!card.isFaceUp) return [];

    // 3) Если это верхняя карта стопки и она открыта — можно двигать её одну
    const isTop = card === stack.topCard;
    if (isTop) return [card];

    // 5) Проверяем всю последовательность от touched до вершины стопки:
    //    - все карты должны быть открыты
    //    - каждая верхняя карта должна «цепляться» к нижней по правилу PILE
    //    cardPile упорядочен снизу-вверх, значит пары (нижняя, верхняя) идут как (i, i+1)
    const { cards } = stack;
    const startIndex = cards.indexOf(card);
    for (let i = startIndex; i < stack.cards.length - 1; i++) {
      const lowerCard = cards[i];
      const upperCard = cards[i + 1];

      // 5.1) Любая закрытая карта внутри цепочки делает перенос недопустимым
      if (!lowerCard.isFaceUp || !upperCard.isFaceUp) return [];

      // 5.2) Проверяем «чередование цвета» и «строго на 1 меньше» для верхней относительно нижней
      //      Внутри стопки: order(upper) = order(lower) - 1 и цвет противоположный
      //      Наша isPileChainable ожидает (top=верхняя, bottom=нижняя)
      if (!lowerCard || !upperCard || !this.isPileChainable(upperCard, lowerCard)) return [];
    }

    // 6) Если все пары валидны и все карты открыты — можно переносить всю верхнюю часть стопки
    return cards.slice(startIndex);
  }

  public isDraggable(
    card: IKlondikeCard | undefined,
    dragStartZone: IKlondikeStack | undefined,
  ): boolean {
    if (card == null || dragStartZone == null) return false;

    const dragStartRules: Record<KlondikeStackType, boolean> = {
      [KlondikeStackType.PILE]: card.isFaceUp,
      [KlondikeStackType.BASE]: card.isFaceUp,
      [KlondikeStackType.GRAVE]: dragStartZone.topCard === card,
      [KlondikeStackType.DECK]: false,
    };

    return dragStartRules[dragStartZone.type] ?? false;
  }

  public isDroppable(
    card: IKlondikeCard | undefined,
    dropZone: IKlondikeStack | undefined,
  ): boolean {
    if (card == null || dropZone == null) return false;

    const dropRules: Record<KlondikeStackType, boolean> = {
      [KlondikeStackType.PILE]: this.canMoveToPile(card, dropZone),
      [KlondikeStackType.BASE]: this.canMoveToBase(card, dropZone),
      [KlondikeStackType.GRAVE]: false,
      [KlondikeStackType.DECK]: false,
    };
    return dropRules[dropZone.type] ?? false;
  }

  // cочетаются ли карты в рабочей стопке - не проверяй стопку
  public isPileChainable(top: IKlondikeCard, bottom: IKlondikeCard): boolean {
    return (
      !this.isSameColor(top.suit, bottom.suit) &&
      this.cardOrder(bottom.value) === this.cardOrder(top.value) + 1
    );
  }

  // cочетаются ли карты в базе - не проверяй стопку
  public isBaseChainable(top: IKlondikeCard, bottom: IKlondikeCard): boolean {
    return (
      top.suit === bottom.suit && this.cardOrder(bottom.value) === this.cardOrder(top.value) - 1
    );
  }

  /** выигрышная ситуация **/
  areAllCardsOnBases(): boolean {
    const { stackMap } = this.props;
    if (stackMap.deck.length > 0) return false;
    if (stackMap.grave.length > 0) return false;
    if (stackMap.piles.some((pile) => pile.cards.length > 0)) return false;

    const cardsOnBases = stackMap.bases.flatMap((base) => base.cards);
    const amount = cardsOnBases.length;
    if (amount !== this.totalCardsAmount) {
      console.warn("amount != totalCardsAmount", amount, this.totalCardsAmount);
    }
    return true;
  }

  /**************
   *  PRIVATE
   ****************/

  private canMoveToBase(card: IKlondikeCard, base: IKlondikeStack): boolean {
    if (base.topCard == null) return card.value === "ace";
    return this.isBaseChainable(card, base.topCard);
  }

  private canMoveToPile(movingCard: IKlondikeCard, pile: IKlondikeStack): boolean {
    if (pile.topCard == null) {
      return movingCard.value === "king";
    }
    return this.isPileChainable(movingCard, pile.topCard);
  }

  private cardOrder(value: CardValue): number {
    return this.valueOrder.indexOf(value);
  }

  private isRed(suit: CardSuit): boolean {
    return suit === CardSuit.heart || suit === CardSuit.diamond;
  }

  private isSameColor(suit1: CardSuit, suit2: CardSuit): boolean {
    return this.isRed(suit1) === this.isRed(suit2);
  }

  private get totalCardsAmount(): number {
    return this.valueOrder.length * this.SUITS_AMOUNT;
  }
}
