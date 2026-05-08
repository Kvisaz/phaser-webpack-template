import { IKlondikeMoveConfig, IKlondikeStackMap, KlondikeGameMove } from "../types";
import { animateCardShake } from "../../cards-abstract";
import { IKlondikeGameMover } from "./types";
import { KlondikeRules } from "../rules";
import { finishAnimation } from "../../../animations";

interface IProps {
  moveConfig: IKlondikeMoveConfig;
  stackMap: IKlondikeStackMap;
  klondikeRules: KlondikeRules;
}

export class InstantGameMover implements IKlondikeGameMover {
  constructor(protected props: IProps) {}

  async run(move: KlondikeGameMove): Promise<void> {
    switch (move.type) {
      case "pickDeckCard": {
        const flipInGrave = "face";
        const { card, from, to } = move.data;
        from.removeCard(card);
        from.layout();
        to.placeCards(card);
        to.layout();
        card.flip(flipInGrave);
        break;
      }
      case "deckRecycle": {
        const flipInDeck = "back";
        const { deck, grave } = move.data;
        const cards = [...grave.cards].reverse();
        cards.forEach((card) => {
          grave.removeCard(card);
          card.flip(flipInDeck);
        });
        grave.layout();
        deck.placeCards(cards);
        deck.layout();
        break;
      }
      case "transfer": {
        const flipOpenedCard = "face";
        const { cards, to, from, openedPileCard } = move.data;
        cards.forEach((card) => {
          from.removeCard(card);
        });
        from.layout();
        to.placeCards(cards);
        to.layout();

        if (openedPileCard) {
          openedPileCard.flip(flipOpenedCard);
        }

        break;
      }
      case "wrongCard": {
        const { card, from } = move.data;
        finishAnimation(card);
        from.layout();
        await animateCardShake({ card });
        break;
      }
      case "wrongDrop": {
        const { from, cards } = move.data;
        from.layout();
        break;
      }
      case "magic": {
        const { card, from, to } = move.data;
        from.removeCard(card);
        from.layout();
        if (!card.isFaceUp) {
          card.flip("face");
        }
        to.placeCards(card);
        to.layout();
        break;
      }
      case "unacceptableMove": {
        console.warn("unacceptableMove", move.type);
        break;
      }
    }
  }

  async undo(move: KlondikeGameMove): Promise<void> {
    switch (move.type) {
      case "pickDeckCard": {
        const flipInDeck = "back";
        const { card, from: to, to: from } = move.data;
        from.removeCard(card);
        from.layout();
        to.placeCards(card);
        to.layout();
        card.flip(flipInDeck);
        break;
      }
      case "deckRecycle": {
        const flipInGrave = "face";
        const { deck, grave } = move.data;
        const cards = [...grave.cards].reverse();
        cards.forEach((card) => {
          deck.removeCard(card);
          card.flip(flipInGrave);
        });
        grave.placeCards(cards);
        grave.layout();
        deck.layout();
        break;
      }
      case "transfer": {
        const flipOpenedCard = "back";
        const { cards, to: from, from: to, openedPileCard } = move.data;
        cards.forEach((card) => {
          from.removeCard(card);
        });
        from.layout();
        to.placeCards(cards);
        to.layout();

        if (openedPileCard) {
          openedPileCard.flip(flipOpenedCard);
        }

        break;
      }
      case "wrongCard":
      case "wrongDrop":
      case "unacceptableMove": {
        // состояние не менялось — откатывать нечего
        break;
      }
      case "magic": {
        const { card, to: from, from: to, fromIndex } = move.data;
        from.removeCard(card);
        from.layout();
        card.flip("back");
        to.placeCards(card, fromIndex);
        to.layout();
        break;
      }
    }
  }
}
