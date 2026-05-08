import { ISpiderCard, ISpiderStack, ISpiderStackMap } from "../types";

interface ISpiderHintHelperProps {
  stackMap: ISpiderStackMap;
  getMovableChain: (card: ISpiderCard) => ISpiderCard[];
  canMoveToTableau: (movingCard: ISpiderCard, tableau: ISpiderStack) => boolean;
  isTableauChainable: (top: ISpiderCard, bottom: ISpiderCard) => boolean;
}

export class SpiderHintHelper {
  constructor(private readonly props: ISpiderHintHelperProps) {}

  /**
   * Находит подсказку по скорингу:
   * - собираем все валидные ходы переносов между tableau,
   * - каждому ходу считаем score (польза - потери),
   * - выбираем ход с максимальным score.
   *
   * Если allowMeaninglessHints=false и лучший score <= 0,
   * то подсказка считается "бессмысленной" и не показывается.
   * Если allowMeaninglessHints=true, возвращаем лучший ход,
   * а если ходов нет — fallback на первый найденный валидный.
   */
  findHintMove(allowMeaninglessHints = true):
    | { from: ISpiderStack; to: ISpiderStack; cards: ISpiderCard[] }
    | undefined {

    const { stackMap, getMovableChain, canMoveToTableau } = this.props;
    const tableaus = stackMap.tableaus;
    let fallbackMove: { from: ISpiderStack; to: ISpiderStack; cards: ISpiderCard[] } | undefined;
    let bestMove: { from: ISpiderStack; to: ISpiderStack; cards: ISpiderCard[]; score: number } | undefined;

    for (const from of tableaus) {
      for (let i = from.cards.length - 1; i >= 0; i--) {
        const card = from.cards[i];
        if (!card.isFaceUp) continue;
        const chain = getMovableChain(card);
        if (chain.length === 0) continue;

        for (const to of tableaus) {
          if (to === from) continue;
          if (canMoveToTableau(chain[0], to)) {
            const move = { from, to, cards: chain };
            if (!fallbackMove) {
              fallbackMove = move;
            }
            const score = this.scoreHintMove(move);
            if (!bestMove || score > bestMove.score) {
              bestMove = { ...move, score };
            }
          }
        }
      }
    }

    if (!bestMove) return allowMeaninglessHints ? fallbackMove : undefined;
    if (!allowMeaninglessHints && bestMove.score <= 0) return undefined;
    return bestMove;
  }

  private scoreHintMove(move: {
    from: ISpiderStack;
    to: ISpiderStack;
    cards: ISpiderCard[];
  }): number {
    const { from, to, cards } = move;

    const fromIndex = from.cards.indexOf(cards[0]);
    /** Бонус за раскрытие закрытой карты в исходной колонке. */
    const revealsCard = fromIndex > 0 && !from.cards[fromIndex - 1].isFaceUp;
    const revealScore = revealsCard ? 5 : 0;

    /** Бонус за завершение последовательности K..A в результате хода. */
    const completes = this.isCompleteSequence([...to.cards, ...cards]);
    const completeScore = completes ? 4 : 0;

    /** Бонус за прирост одномастной убывающей цепочки в цели. */
    const beforeTail = this.getSameSuitTailLength(to.cards);
    const afterTail = this.getSameSuitTailLength([...to.cards, ...cards]);
    const tailGain = Math.max(0, afterTail - beforeTail);
    const tailGainScore = Math.min(3, tailGain);

    /** Штраф за потерю одномастной убывающей цепочки в источнике. */
    const fromBeforeTail = this.getSameSuitTailLength(from.cards);
    const fromAfterCards = from.cards.slice(0, fromIndex);
    const fromAfterTail = this.getSameSuitTailLength(fromAfterCards);
    const tailLoss = Math.max(0, fromBeforeTail - fromAfterTail);
    const tailLossScore = Math.min(3, tailLoss);

    return revealScore + completeScore + tailGainScore - tailLossScore;
  }

  private isCompleteSequence(cards: ISpiderCard[]): boolean {
    if (cards.length !== 13) return false;
    const suit = cards[0]?.suit;
    if (suit == null) return false;
    if (cards[0].value !== "king") return false;
    if (cards[cards.length - 1].value !== "ace") return false;
    if (cards.some((c) => c.suit !== suit)) return false;

    for (let i = 0; i < cards.length - 1; i++) {
      const top = cards[i];
      const bottom = cards[i + 1];
      if (!this.props.isTableauChainable(top, bottom)) return false;
    }

    return true;
  }

  private getSameSuitTailLength(cards: ISpiderCard[]): number {
    if (cards.length === 0) return 0;
    let count = 1;
    for (let i = cards.length - 1; i > 0; i--) {
      const top = cards[i];
      const bottom = cards[i - 1];
      if (!top.isFaceUp || !bottom.isFaceUp) break;
      if (top.suit !== bottom.suit) break;
      if (!this.props.isTableauChainable(bottom, top)) break;
      count += 1;
    }
    return count;
  }
}
