import {
  IKlondikeCard,
  IKlondikeStack,
  IKlondikeStackMap,
  KlondikeGameMove,
  KlondikeStackType,
} from "../types";
import { KlondikeRules } from "../rules";

interface IProps {
  stackMap: IKlondikeStackMap;
  klondikeRules: KlondikeRules;
  singleTransferDuration?: number;
  runMove: (move: KlondikeGameMove) => Promise<void>;
}

export class KlondikeAutoCompleter {
  constructor(private readonly props: IProps) {}

  public isAutoCompletePossible(): boolean {
    const { stackMap, klondikeRules } = this.props;
    return stackMap.piles.every((pile) => isPileOrderedAndFaceUp(pile, klondikeRules));
  }

  public async runAutoCompleteAnimation(): Promise<void> {
    if (!this.isAutoCompletePossible()) return;
    const maxSteps = 1000;
    for (let i = 0; i < maxSteps; i += 1) {
      const movedToBase = await this.tryMoveTopCardToBase();
      if (movedToBase) continue;

      if (this.props.stackMap.deck.length === 0) {
        const recycled = await this.tryRecycleDeck();
        if (recycled) continue;
      }

      const picked = await this.tryPickDeckCard();
      if (picked) continue;

      break;
    }
  }

  private async tryMoveTopCardToBase(): Promise<boolean> {
    const target = findTopCardToBaseTarget(this.props.stackMap, this.props.klondikeRules);
    if (!target) return false;
    await this.transferCard(target.card, target.from, target.to);
    return true;
  }

  private async tryPickDeckCard(): Promise<boolean> {
    const card = this.props.stackMap.deck.topCard;
    if (!card) return false;
    await this.pickDeckCard(card);
    return true;
  }

  private async tryRecycleDeck(): Promise<boolean> {
    const { deck, grave } = this.props.stackMap;
    if (deck.length > 0 || grave.length === 0) return false;
    await this.recycleDeck();
    return true;
  }

  private async transferCard(
    card: IKlondikeCard,
    from: IKlondikeStack,
    to: IKlondikeStack,
  ): Promise<void> {
    const openedPileCard = getOpenedPileCard(from);
    await this.props.runMove({
      type: "transfer",
      data: {
        cards: [card],
        from,
        to,
        openedPileCard,
        durationMs: this.autoMoveDuration,
      },
    });
  }

  private async pickDeckCard(card: IKlondikeCard): Promise<void> {
    const { deck, grave } = this.props.stackMap;
    await this.props.runMove({
      type: "pickDeckCard",
      data: {
        card,
        from: deck,
        to: grave,
        durationMs: this.autoMoveDuration,
      },
    });
  }

  private async recycleDeck(): Promise<void> {
    const { deck, grave } = this.props.stackMap;
    await this.props.runMove({
      type: "deckRecycle",
      data: {
        deck,
        grave,
        durationMs: this.autoMoveDuration,
      },
    });
  }

  private get autoMoveDuration(): number {
    return this.props.singleTransferDuration ?? 120;
  }
}

function isPileOrderedAndFaceUp(pile: IKlondikeStack, rules: KlondikeRules): boolean {
  const { cards } = pile;
  if (cards.length === 0) return true;
  if (cards.some((card) => !card.isFaceUp)) return false;

  for (let i = 0; i < cards.length - 1; i += 1) {
    const bottom = cards[i];
    const top = cards[i + 1];
    if (!rules.isPileChainable(top, bottom)) return false;
  }

  return true;
}

function findTopCardToBaseTarget(
  stackMap: IKlondikeStackMap,
  rules: KlondikeRules,
): { card: IKlondikeCard; from: IKlondikeStack; to: IKlondikeStack } | undefined {
  const topCards = getTopPlayableCards(stackMap);
  for (const { card, from } of topCards) {
    const base = stackMap.bases.find((stack) => rules.isDroppable(card, stack));
    if (!base) continue;
    return { card, from, to: base };
  }
}

function getTopPlayableCards(
  stackMap: IKlondikeStackMap,
): Array<{ card: IKlondikeCard; from: IKlondikeStack }> {
  const stacks = [...stackMap.piles, stackMap.grave];
  const result: Array<{ card: IKlondikeCard; from: IKlondikeStack }> = [];

  stacks.forEach((stack) => {
    const card = stack.topCard;
    if (!card || !card.isFaceUp) return;
    result.push({ card, from: stack });
  });

  return result;
}

function getOpenedPileCard(from: IKlondikeStack): IKlondikeCard | undefined {
  if (from.type !== KlondikeStackType.PILE) return;
  return from.cards[from.cards.length - 1 - 1];
}
