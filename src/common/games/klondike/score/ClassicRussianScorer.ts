import { IKlondikeScorer, KlondikeGameMove, KlondikeStackType } from "../types";

const score = {
  recycleDeck: -20,
  openTableCard: 5,
  moveDeckToTable: 5,
  moveToBase: 10,
  moveBaseToTable: -15,
};

interface IProps {}

export class ClassicRussianScorer implements IKlondikeScorer {
  constructor(protected props: IProps) {}

  scoreMove(move: KlondikeGameMove): number {
    switch (move.type) {
      case "deckRecycle": {
        return score.recycleDeck;
      }
      case "transfer": {
        let moveScore = 0;
        const { from, to, openedPileCard } = move.data;
        switch (from.type) {
          case KlondikeStackType.DECK:
            // c колоды ничего не переносится
            break;
          case KlondikeStackType.GRAVE:
            // с открытый колоды можно на базу или в pile
            if (to.type === KlondikeStackType.BASE) {
              moveScore += score.moveToBase;
            }
            break;
          case KlondikeStackType.PILE:
            // со стола можно на базу или в pile
            if (to.type === KlondikeStackType.BASE) {
              moveScore += score.moveToBase;
            }
            // а еще может быть открытая карта
            if (openedPileCard) {
              moveScore += score.openTableCard;
            }
            break;
          case KlondikeStackType.BASE:
            // добровольный съем с базы всегда штрафуется
            moveScore += score.moveBaseToTable;
            break;
        }

        return moveScore;
      }
      case "magic": {
        // оцениваем как обычный перенос без учета открытой карты
        const { from, to } = move.data;
        let moveScore = 0;
        if (to.type === KlondikeStackType.BASE) {
          moveScore += score.moveToBase;
        }
        if (from.type === KlondikeStackType.BASE && to.type !== KlondikeStackType.PILE) {
          moveScore += score.moveBaseToTable;
        }
        return moveScore;
      }
      default: {
        return 0;
      }
    }
  }
}
