import { ISpiderCard, ISpiderMagicMove, ISpiderStack, ISpiderStackMap } from "../types";
import {
  SPIDER_MAGIC_SCORE_CLOSED_CARD_PRIORITY,
  SPIDER_MAGIC_SCORE_DEPTH_STEP,
  SPIDER_MAGIC_SCORE_NON_EMPTY_TARGET_BONUS,
  SPIDER_MAGIC_SCORE_SAME_SUIT_BONUS,
} from "./constants";

interface ISpiderMagicHelperProps {
  stackMap: ISpiderStackMap;
  canMoveToTableau: (movingCard: ISpiderCard, tableau: ISpiderStack) => boolean;
  isTableauChainable: (top: ISpiderCard, bottom: ISpiderCard) => boolean;
}

interface ISpiderMagicCandidate extends ISpiderMagicMove {
  score: number;
}

/**
 * SpiderMagicHelper ищет один лучший "магический" перенос по текущему состоянию tableau.
 *
 * Дефолтные настройки выбора:
 * - приоритет закрытых карт над открытыми (`SPIDER_MAGIC_SCORE_CLOSED_CARD_PRIORITY`);
 * - бонус за перенос на карту той же масти (`SPIDER_MAGIC_SCORE_SAME_SUIT_BONUS`);
 * - небольшой бонус за перенос не в пустую колонку (`SPIDER_MAGIC_SCORE_NON_EMPTY_TARGET_BONUS`);
 * - дополнительный вес по глубине карты в колонке (`SPIDER_MAGIC_SCORE_DEPTH_STEP`).
 *
 * Ограничения:
 * - работает только в tableau (stock/foundation не рассматриваются);
 * - top-card не кандидат (Magic ищет именно блокированные карты);
 * - карты из защищённого хвоста (максимальная валидная переносимая цепочка от top вниз) не трогаются;
 * - helper не делает look-ahead на несколько ходов и выбирает лучший ход по локальному score.
 */
export class SpiderMagicHelper {
  constructor(private readonly props: ISpiderMagicHelperProps) {}

  findMagicMove(): ISpiderMagicMove | undefined {
    const candidates: ISpiderMagicCandidate[] = [];
    const { tableaus } = this.props.stackMap;

    tableaus.forEach((from) => {
      const lastIndex = from.cards.length - 1;
      /** В колонке из 0-1 карты нет блокированных кандидатов. */
      if (lastIndex <= 0) return;

      /** Защищаем хвост: его нельзя ломать магией. */
      const protectedTailStartIndex = this.getProtectedTailStartIndex(from);

      /** Проходим только блокированные карты: индекс всегда меньше top index. */
      for (let fromIndex = 0; fromIndex < lastIndex; fromIndex++) {
        if (protectedTailStartIndex != null && fromIndex >= protectedTailStartIndex) continue;

        const card = from.cards[fromIndex];
        if (card == null) continue;

        const to = this.findTargetTableau({ card, from });
        if (to == null) continue;

        /** Считаем локальный score и складываем валидного кандидата. */
        candidates.push({
          card,
          from,
          to,
          fromIndex,
          flipToFace: !card.isFaceUp,
          score: this.scoreMove({ card, to, fromIndex }),
        });
      }
    });

    if (candidates.length === 0) return;

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
      card: best.card,
      from: best.from,
      to: best.to,
      fromIndex: best.fromIndex,
      flipToFace: best.flipToFace,
    };
  }

  private getProtectedTailStartIndex(from: ISpiderStack): number | undefined {
    const { cards } = from;
    if (cards.length === 0) return;

    /** Строим хвост от top вниз, пока сохраняется face-up убывающая цепочка. */
    let protectedStart = cards.length - 1;
    if (!cards[protectedStart]?.isFaceUp) return;

    while (protectedStart > 0) {
      const top = cards[protectedStart - 1];
      const bottom = cards[protectedStart];
      if (!top?.isFaceUp || !bottom?.isFaceUp) break;
      if (!this.props.isTableauChainable(top, bottom)) break;
      protectedStart -= 1;
    }

    return protectedStart;
  }

  private findTargetTableau({
    card,
    from,
  }: {
    card: ISpiderCard;
    from: ISpiderStack;
  }): ISpiderStack | undefined {
    const { tableaus } = this.props.stackMap;
    /** Целью может быть только другая tableau, куда карта валидно дропается. */
    const candidates = tableaus.filter(
      (to) => to !== from && this.props.canMoveToTableau(card, to),
    );
    if (candidates.length === 0) return;

    /** Предпочитаем не пустую колонку, и внутри неё - совпадение масти. */
    const nonEmpty = candidates.filter((tableau) => tableau.topCard != null);
    const sameSuit = nonEmpty.filter((tableau) => tableau.topCard?.suit === card.suit);

    return sameSuit[0] ?? nonEmpty[0] ?? candidates[0];
  }

  private scoreMove({
    card,
    to,
    fromIndex,
  }: {
    card: ISpiderCard;
    to: ISpiderStack;
    fromIndex: number;
  }): number {
    const closedPriority = card.isFaceUp ? 0 : SPIDER_MAGIC_SCORE_CLOSED_CARD_PRIORITY;
    const toTop = to.topCard;
    const sameSuitBonus = toTop?.suit === card.suit ? SPIDER_MAGIC_SCORE_SAME_SUIT_BONUS : 0;
    const nonEmptyBonus = toTop != null ? SPIDER_MAGIC_SCORE_NON_EMPTY_TARGET_BONUS : 0;
    const depthBonus = fromIndex * SPIDER_MAGIC_SCORE_DEPTH_STEP;
    return closedPriority + sameSuitBonus + nonEmptyBonus + depthBonus;
  }
}
