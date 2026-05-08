import { safeArray } from "../../../collections";
import {
  IHintCombo,
  IKlondikeCard,
  IKlondikeStack,
  IKlondikeStackMap,
  IMagicCombo,
  KlondikeStackType,
} from "../types";
import { KlondikeRules } from "../rules";

interface IProps {
  stackMap: IKlondikeStackMap;
  klondikeRules: KlondikeRules;
  tricksConfig?: {
    /** если true
     * - воспринимает клик по pile как приказ взять из нее максимальную стопку
     * если false - отсчитывает только с этой карты
     * **/
    autoMoveMaximize?: boolean;
  };
}

export class KlondikeTricks {
  constructor(private readonly props: IProps) {}

  public getHintCard(): IHintCombo | undefined {
    return this.getHintCardFromTop() ?? this.getHintCardFromChains();
  }

  public getHintCardFromChains(): IHintCombo | undefined {
    const movableChains = this.getMovableChains().filter((chain) => chain.length > 1);
    if (movableChains.length === 0) return;
    const chainHeads = movableChains.map((chain) => chain[0]);

    const skipBase = true;
    return this.getHintCardFromCards(chainHeads, skipBase);
  }

  public getPilesHiddenGoodCard(): IMagicCombo | undefined {
    const { stackMap } = this.props;
    const lockedCards = this.getHiddenPileCards();
    const lockedCardMagicPowers = lockedCards.map((card) => {
      let power = 0;
      let acceptableStack: IKlondikeStack | undefined;

      const acceptableBase = this.getAcceptableBase(card);
      if (acceptableBase) {
        power += 2;
        acceptableStack = acceptableBase;
      } else {
        const acceptablePile = this.getAcceptablePile(card);
        if (acceptablePile) {
          acceptableStack = acceptablePile;
          power += 1;
        }
      }

      return {
        card,
        power,
        acceptableStack,
      };
    });

    const bestMagicPowerSorted = lockedCardMagicPowers.sort((a, b) => b.power - a.power);

    const bestMagicCombo = bestMagicPowerSorted[0];

    if (bestMagicCombo) {
      const card = bestMagicCombo.card;
      const from = stackMap.get(card.stackId);
      const to = bestMagicCombo.acceptableStack;

      if (from && to) {
        return {
          card,
          from,
          to,
        };
      }
    }
  }

  public getHiddenPileCards(): IKlondikeCard[] {
    const { stackMap } = this.props;
    const cards: IKlondikeCard[] = [];
    stackMap.piles.forEach((pile) => {
      pile.cards.forEach((card) => {
        if (!card.isFaceUp) cards.push(card);
      });
    });
    return cards;
  }

  public calcAutoMove(
    card: IKlondikeCard,
    fromStack: IKlondikeStack,
    options?: { respectSelection?: boolean; disableBasePriority?: boolean },
  ) {
    /**
     * disableBasePriority: запрещаем приоритет базы.
     * Нужно, чтобы клик по карте внутри pile не уводил верхнюю карту на базу,
     * если игрок ожидал перенос цепочки от выбранной карты.
     **/
    const allowBasePriority = options?.disableBasePriority !== true;
    const isMaxiMode = this.props.tricksConfig?.autoMoveMaximize===true && !options?.respectSelection;

    console.log(`calcAutoMove 01 isMaxiMode = ${isMaxiMode}`);
    /** Собираем карты, для которых будем искать ход **/
    let movingCards: IKlondikeCard[];
    if (fromStack.type === KlondikeStackType.PILE) {
      console.log(`calcAutoMove 02 IS PILE`);

      /** для стопки - ищем пачку карт, максимальную или строгую **/
      movingCards = isMaxiMode
        ? this.getMaxiAutoMovePileChain(card, fromStack)
        : this.getStrictAutoMovePileChain(card, fromStack);
    } else {
      console.log(`calcAutoMove 02 IS ${fromStack.type}`);
      /** для любой другой пачки - берем верхнюю карту или проверяем что карта верхняя **/
      movingCards = isMaxiMode
        ? this.getMaxiAutoMoveAnyChain(card, fromStack)
        : this.getStrictAutoMoveAnyChain(card, fromStack);
    }

    if (movingCards.length === 0) return;

    const targetStack = this.findAutoMoveTarget(movingCards, fromStack, allowBasePriority);

    console.log(`calcAutoMove 03 targetStack  ${targetStack?.type}`);

    if (!targetStack) return;

    /** если перемещаем на базу - только верхнюю **/
    if (targetStack.type === "base") {
      const topCard = movingCards[movingCards.length - 1];
      movingCards = [topCard];
    }
    /** на Pile можно стопку **/

    return {
      cards: movingCards,
      from: fromStack,
      to: targetStack,
    };
  }

  /**************
   *  PRIVATE
   ****************/

  /** Кандидат для автохода для стопки на столе - PILE - берет цепочку карт **/
  private getMaxiAutoMovePileChain(card: IKlondikeCard, pile: IKlondikeStack): IKlondikeCard[] {
    return this.getMovableChain(pile) ?? safeArray([pile.topCard]);
  }

  private getStrictAutoMovePileChain(card: IKlondikeCard, pile: IKlondikeStack): IKlondikeCard[] {
    const { klondikeRules } = this.props;
    /** строгий поиск - только если карта на верху, открыта и тогда мы отсчитываем с нее **/
    if (!card.isFaceUp) return [];
    const strictCards = pile.topCard === card ? [card] : klondikeRules.getPileMovableCards(card);
    return strictCards;
  }

  /** Кандидат для автохода  для любой стопки кроме PILE **/
  private getMaxiAutoMoveAnyChain(card: IKlondikeCard, stack: IKlondikeStack): IKlondikeCard[] {
    // берем верхнюю карту только если она открыта; закрытые не двигаем даже в лояльном режиме
    const top = stack.topCard;
    return top && top.isFaceUp ? [top] : [];
  }

  private getStrictAutoMoveAnyChain(card: IKlondikeCard, stack: IKlondikeStack): IKlondikeCard[] {
    /** строгий поиск - только если карта открыта,  на верху и тогда мы отсчитываем с нее **/
    if (card.isFaceUp && stack.topCard === card) return [card];
    return [];
  }

  private getHintCardFromTop(): IHintCombo | undefined {
    const { stackMap } = this.props;
    const topCards = safeArray(
      stackMap.all
        .filter((s) => s.type === KlondikeStackType.GRAVE || s.type === KlondikeStackType.PILE)
        .map((s) => s.topCard),
    );
    return this.getHintCardFromCards(topCards);
  }

  private getHintCardFromCards(cards: IKlondikeCard[], skipBase?: boolean): IHintCombo | undefined {
    const { stackMap } = this.props;
    const rules = [
      (card: IKlondikeCard) => {
        if (skipBase) return;
        const to = this.getAcceptableBase(card);
        return to && { power: 10, to };
      },
      (card: IKlondikeCard) => {
        const to = this.getAcceptablePile(card);
        const below = to && this.getCardBelow(card);
        if (to && below && this.getAcceptableBase(below)) return { power: 9, to };
      },
      (card: IKlondikeCard) => {
        const to = this.getAcceptablePile(card);
        const below = to && this.getCardBelow(card);
        if (to && below && this.getAcceptablePile(below)) return { power: 5, to };
      },
      (card: IKlondikeCard) => {
        const to = this.getAcceptablePile(card);
        const below = to && this.getCardBelow(card);
        if (to && below && !below.isFaceUp) return { power: 2, to };
      },
      (card: IKlondikeCard) => {
        const to = this.getAcceptablePile(card);
        const below = to && this.getCardBelow(card);
        if (to && !below && to.length > 0) return { power: 3, to };
      },
      (card: IKlondikeCard) => {
        const from = stackMap.get(card.stackId);
        if (from?.type !== KlondikeStackType.GRAVE) return;
        const to = this.getAcceptablePile(card);
        if (to) return { power: 1, to };
      },
    ];

    const candidates = safeArray(cards).map((card) => {
      const from = stackMap.get(card.stackId);
      if (!from) return;
      const scored = rules.map((rule) => rule(card)).find((res) => res);
      return scored ? { card, from, to: scored.to, power: scored.power } : undefined;
    });

    const best = safeArray(candidates).sort((a, b) => b.power - a.power)[0];
    return best ? { card: best.card, from: best.from, to: best.to } : undefined;
  }

  private getCardBelow(card: IKlondikeCard): IKlondikeCard | undefined {
    const { stackMap } = this.props;
    const fromStack = stackMap.get(card.stackId);
    if (fromStack == null) return;
    const { cards } = fromStack;
    const cardIndex = cards.indexOf(card);
    const belowCardIndex = cardIndex - 1;
    return belowCardIndex >= 0 ? cards[belowCardIndex] : undefined;
  }

  private getMovableChains(): IKlondikeCard[][] {
    const { stackMap } = this.props;
    const movableGroups: IKlondikeCard[][] = [];
    stackMap.piles.forEach((pile) => {
      const chain = this.getMovableChain(pile);
      if (chain) movableGroups.push(chain);
    });
    return movableGroups;
  }

  /** взять максимальную стопку карт которую можно перенести **/
  private getMovableChain(pile: IKlondikeStack): undefined | IKlondikeCard[] {
    const { klondikeRules } = this.props;
    const movableGroup: IKlondikeCard[] = [];
    let topCard = pile.topCard;
    if (topCard) {
      movableGroup.push(topCard);
      let belowIndex = pile.length - 2;
      let belowCard = pile.cards[belowIndex];
      while (belowCard?.isFaceUp && klondikeRules.isPileChainable(topCard, belowCard)) {
        movableGroup.push(belowCard);
        belowIndex--;
        topCard = belowCard;
        belowCard = pile.cards[belowIndex];
      }
    }
    if (movableGroup.length > 0) {
      return movableGroup.reverse();
    }
  }

  private getAcceptableBase(card: IKlondikeCard): IKlondikeStack | undefined {
    const { stackMap, klondikeRules } = this.props;
    return stackMap.bases.find((base) => klondikeRules.isDroppable(card, base));
  }

  private getAcceptablePile(card: IKlondikeCard): IKlondikeStack | undefined {
    const { stackMap, klondikeRules } = this.props;
    return stackMap.piles.find((pile) => klondikeRules.isDroppable(card, pile));
  }

  private findAutoMoveTarget(
    movingCards: IKlondikeCard[],
    fromStack: IKlondikeStack,
    allowBasePriority: boolean,
  ): IKlondikeStack | undefined {
    const { stackMap, klondikeRules } = this.props;
    // нет карт — нет цели
    if (movingCards.length === 0) return;

    const sourceType = fromStack.type;
    // для переноса в PILE важна нижняя карта цепочки, для базы — верхняя
    const bottomCard = movingCards[0];
    const topCard = movingCards[movingCards.length - 1];
    // на базу можно только если верх цепочки совпадает с фактическим топом стека
    const isTopCard = fromStack.topCard === topCard;

    // сначала пробуем отправить верхнюю карту на базу
    if (allowBasePriority && sourceType !== KlondikeStackType.BASE && isTopCard) {
      for (const base of stackMap.bases) {
        // мы только что проверили sourceType !== KlondikeStackType.BASE
        // - так что эта проверка не нужна
        // if (base === fromStack) continue;
        if (klondikeRules.isDroppable(topCard, base)) {
          return base;
        }
      }
    }

    // иначе ищем PILE, куда можно положить всю цепочку снизу
    for (const pile of stackMap.piles) {
      if (pile === fromStack) continue;
      if (klondikeRules.isDroppable(bottomCard, pile)) {
        return pile;
      }
    }

    return;
  }
}
