import {
  IKlondikeCard,
  IKlondikeStack,
  IKlondikeStackMap,
  InGameUserLowLevelInput,
  KlondikeGameMove,
  KlondikeStackType,
} from "../types";
import { KlondikeTricks } from "../KlondikeTricks/KlondikeTricks";

interface IProps {
  stackMap: IKlondikeStackMap;
  klondikeTricks: KlondikeTricks;
}

export class GameReactionsMapper {
  constructor(protected props: IProps) {}

  mapUserActionToMove<K extends keyof InGameUserLowLevelInput>(
    event: K,
    data: InGameUserLowLevelInput[K],
  ): KlondikeGameMove {
    const { stackMap } = this.props;
    switch (event) {
      case "onDeckClick": {
        /** клик на колоде (место) - открываем 1 карту или ресайкл **/
        const topCard = stackMap.deck.topCard;

        if (topCard)
          return {
            type: "pickDeckCard",
            data: {
              from: stackMap.deck,
              to: stackMap.grave,
              card: topCard,
            },
          };
        else
          return {
            type: "deckRecycle",
            data: {
              deck: stackMap.deck,
              grave: stackMap.grave,
            },
          };
      }
      case "onCardClick": {
        const { card } = data as InGameUserLowLevelInput["onCardClick"];
        const from = stackMap.get(card.stackId)!;

        /** клик на карте из колоды - открываем 1 карту **/
        if (from.type === "deck") {
          const topCard = stackMap.deck.topCard;
          if (topCard)
            return {
              type: "pickDeckCard",
              data: {
                from: stackMap.deck,
                to: stackMap.grave,
                card: topCard,
              },
            };
        }

        /**
         * Клик по карте = автоход, но строго уважаем выбранную карту:
         * - если клик по верхней карте, допускаем приоритет базы,
         * - если клик по карте внутри pile, база запрещена, ищем pile для цепочки от этой карты,
         * - если цепочка от выбранной карты не переносима, это "wrongCard".
         **/
        const disableBasePriority = from.topCard !== card;
        const autoMove = this.props.klondikeTricks.calcAutoMove(card, from, {
          respectSelection: true,
          disableBasePriority,
        });
        if (autoMove) {
          return transfer({
            cards: autoMove.cards,
            from: autoMove.from,
            to: autoMove.to,
          });
        }

        return {
          type: "wrongCard",
          data: {
            card,
            from,
          },
        };
      }
      case "onCardDrop": {
        const { cards, toStack } = data as InGameUserLowLevelInput["onCardDrop"];
        const from = stackMap.get(cards[0]?.stackId)!;
        if (toStack != null && from != null) {
          return transfer({
            cards,
            from,
            to: toStack,
          });
        }

        /** если плохой дроп и 1 карта - ищем автоход **/
        if (cards.length === 1) {
          const card = cards[0];
          // после плохого дропа уважаем выбор игрока и не расширяем цепочку
          const autoMove = this.props.klondikeTricks.calcAutoMove(card, from, {
            respectSelection: true,
          });
          if (autoMove) {
            return transfer({
              cards: autoMove.cards,
              from: autoMove.from,
              to: autoMove.to,
            });
          }
        }

        /** не нашли автоход - просто плохой дроп **/
        return {
          type: "wrongDrop",
          data: { cards, from },
        };
      }
    }

    return { type: "unacceptableMove" };
  }
}

function transfer(args: {
  cards: IKlondikeCard[];
  from: IKlondikeStack;
  to: IKlondikeStack;
}): KlondikeGameMove {
  const { cards, from, to } = args;

  let openedPileCard: IKlondikeCard | undefined;

  if (from.type === KlondikeStackType.PILE) {
    openedPileCard = from.cards[from.cards.length - 1 - cards.length];
  }

  return {
    type: "transfer",
    data: { cards, from, to, openedPileCard },
  };
}
