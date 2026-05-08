import {
  IKlondikeCard,
  IKlondikeGameMaster,
  IKlondikeStack,
  IKlondikeStackMap,
  KlondikeStackType,
} from "./types";
import { KlondikeRules } from "./rules";

interface IProps {
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
export class DefaultKlondikeGameMaster implements IKlondikeGameMaster {
  private klondikeRules: KlondikeRules;

  constructor(protected props: IProps) {
    const { stackMap } = props;
    this.klondikeRules = new KlondikeRules({ stackMap });
  }

  isDraggable(clickedCard: IKlondikeCard): boolean {
    const { stackMap } = this.props;
    const fromStack = stackMap.get(clickedCard.stackId);
    if (fromStack == null) {
      console.warn("fromStack==null");
      return false;
    }
    return this.klondikeRules.isDraggable(clickedCard, fromStack);
  }

  isDroppable(card: IKlondikeCard, dropZone: IKlondikeStack): boolean {
    return this.klondikeRules.isDroppable(card, dropZone);
  }

  getPileMovableCards(clickedCard: IKlondikeCard): IKlondikeCard[] {
    const { stackMap } = this.props;
    const fromStack = stackMap.get(clickedCard.stackId);
    if (fromStack == null) {
      console.warn("fromStack==null");
      return [];
    }
    const isPile = fromStack.type === KlondikeStackType.PILE;
    const draggingCards = isPile
      ? this.klondikeRules.getPileMovableCards(clickedCard)
      : [clickedCard];
    return draggingCards;
  }
}
