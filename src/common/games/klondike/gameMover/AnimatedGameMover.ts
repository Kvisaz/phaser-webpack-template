import { IKlondikeMoveConfig, IKlondikeStackMap, KlondikeGameMove } from "../types";
import {
  animateCardFlip,
  animateCardMove,
  animateCardShake,
  layoutForAnimation
} from "../../cards-abstract";
import { IKlondikeGameMover } from "./types";
import { KlondikeRules } from "../rules";
import { finishAnimation } from "../../../animations";

interface IProps {
  moveConfig: IKlondikeMoveConfig;
  stackMap: IKlondikeStackMap;
  klondikeRules: KlondikeRules;
}

/**
 *  done 1 - ты сделал InstantGameMover, запиши копию как InstantMover и используй в игре
 *  done 2 - реализуй действительно AnimatedGameMover
 *  done 3 - реализуй Scorer
 *  done 4 - реализуй History с откатом ходов и score
 **/
export class AnimatedGameMover implements IKlondikeGameMover {
  constructor(protected props: IProps) {
  }

  async run(move: KlondikeGameMove): Promise<void> {
    const { moveConfig } = this.props;
    switch (move.type) {
      case "pickDeckCard": {
        const flipInGrave = 'face';
        const { card, from, to, durationMs } = move.data;
        const moveDuration = durationMs ?? moveConfig.pickDeckCardMoveDuration;
        from.removeCard(card);
        to.placeCards(card);

        const moveParams = layoutForAnimation({
          cards: to.cards,
          layout: () => to.layout()
        });

        try {
          await animateCardMove({
            moveParams,
            duration: moveDuration
          });
          await animateCardFlip({
            card,
            flipTo: flipInGrave,
            duration: moveConfig.pickDeckCardFlipDuration
          });
        } catch (e) {
          console.warn(e);
          // приводим в порядок стопки
          to.layout();
          from.layout();
          // и карту
          card.flip(flipInGrave);
        }
        break;
      }
      case "deckRecycle": {
        const flipToInDeck = "back";
        const { deck, grave, durationMs } = move.data;
        const moveDuration = durationMs ?? moveConfig.deckRecycleDuration;
        const cards = [...grave.cards].reverse();
        cards.forEach((card) => {
          grave.removeCard(card);
          card.flip(flipToInDeck);
        });
        deck.placeCards(cards);

        const moveParams = layoutForAnimation({
          cards,
          layout: () => deck.layout()
        });

        try {
          await animateCardMove({
            moveParams,
            duration: moveDuration
          });
        } catch (e) {
          console.warn(e);
          grave.layout();
          deck.layout();
          cards.forEach((c) => c.flip(flipToInDeck));
        }
        break;
      }
      case "transfer": {
        const flipOpenedCardTo = "face";
        const { cards, to, from, openedPileCard, durationMs } = move.data;
        const moveDuration = durationMs ?? 350;
        const fromLayoutDuration = durationMs ?? 150;
        const flipDuration = durationMs ?? 150;
        cards.forEach((card) => {
          from.removeCard(card);
        });
        to.placeCards(cards);

        const moveParams = layoutForAnimation({
          cards,
          layout: () => to.layout()
        });

        const fromLayoutParams = layoutForAnimation({
          cards: from.cards,
          layout: () => from.layout()
        });

        try {
          // переносим карту и параллельно выравниваем исходник
          await Promise.all([
            animateCardMove({
              moveParams,
              duration: moveDuration
            }),
            animateCardMove({
              moveParams: fromLayoutParams,
              duration: fromLayoutDuration
            })
          ]);

          // если надо открыть карту на столе - открываем
          if (openedPileCard) {
            await animateCardFlip({
              card: openedPileCard,
              flipTo: flipOpenedCardTo,
              duration: flipDuration
            });
          }
        } catch (e) {
          console.warn(e);
          from.layout();
          to.layout();
          if (openedPileCard) {
            openedPileCard.flip(flipOpenedCardTo);
          }
        }
        break;
      }
      case "wrongCard": {
        // анимируем тряску
        const { card, from } = move.data;
        finishAnimation(card);
        from.layout();
        await animateCardShake({ card, duration: moveConfig.wrongCardShakeDuration });
        break;
      }
      case "wrongDrop": {
        // ничего не анимируем и так хорошо
        const { from } = move.data;
        from.layout();
        break;
      }
      case "unacceptableMove": {
        console.warn("unacceptableMove", move.type);
        break;
      }
      case "magic": {
        const liftOffset = 30;
        const { card, from, to, durationMs } = move.data;
        const {
          liftDuration,
          flipDuration,
          moveDuration,
          fromLayoutDuration,
        } = getMagicDurations(durationMs);

        try {
          await new Promise<void>((resolve) => {
            card.scene.tweens.add({
              targets: card,
              y: card.y - liftOffset,
              duration: liftDuration,
              ease: Phaser.Math.Easing.Sine.Out,
              onComplete: () => resolve(),
            });
          });

          await animateCardFlip({
            card,
            flipTo: "face",
            duration: flipDuration,
          });

          from.removeCard(card);
          to.placeCards(card);

          const moveParams = layoutForAnimation({
            cards: [card],
            layout: () => to.layout(),
          });

          const fromLayoutParams = layoutForAnimation({
            cards: from.cards,
            layout: () => from.layout(),
          });

          await Promise.all([
            animateCardMove({
              moveParams,
              duration: moveDuration,
            }),
            animateCardMove({
              moveParams: fromLayoutParams,
              duration: fromLayoutDuration,
            }),
          ]);
        } catch (e) {
          console.warn(e);
          from.layout();
          to.layout();
        }
        break;
      }
    }
  }

  async undo(move: KlondikeGameMove): Promise<void> {
    const { moveConfig } = this.props;
    switch (move.type) {
      case "pickDeckCard": {
        const flipInDeck = 'back';
        const { card, from: to, to: from} = move.data;
        from.removeCard(card);
        to.placeCards(card);

        const moveParams = layoutForAnimation({
          cards: to.cards,
          layout: () => to.layout()
        });

        try {
          await animateCardMove({
            moveParams,
            duration: moveConfig.pickDeckCardMoveDuration
          });
          await animateCardFlip({
            card,
            flipTo: flipInDeck,
            duration: moveConfig.pickDeckCardFlipDuration
          });
        } catch (e) {
          console.warn(e);
          // приводим в порядок стопки
          to.layout();
          from.layout();
          // и карту
          card.flip(flipInDeck);
        }
        break;
      }
      case "deckRecycle": {
        const flipToInGrave = "face";
        const { deck, grave } = move.data;
        const cards = [...deck.cards].reverse();
        cards.forEach((card) => {
          deck.removeCard(card);
          card.flip(flipToInGrave);
        });
        grave.placeCards(cards);

        const moveParams = layoutForAnimation({
          cards,
          layout: () => deck.layout()
        });

        try {
          await animateCardMove({
            moveParams,
            duration: moveConfig.deckRecycleDuration
          });
        } catch (e) {
          console.warn(e);
          grave.layout();
          deck.layout();
          cards.forEach((c) => c.flip(flipToInGrave));
        }
        break;
      }
      case "transfer": {
        const flipOpenedCardTo = "back";
        const { cards, to: from, from: to, openedPileCard } = move.data;
        cards.forEach((card) => {
          from.removeCard(card);
        });
        to.placeCards(cards);

        const moveParams = layoutForAnimation({
          cards,
          layout: () => to.layout()
        });

        const fromLayoutParams = layoutForAnimation({
          cards: from.cards,
          layout: () => from.layout()
        });

        try {
          // переносим карту и параллельно выравниваем исходник
          await Promise.all([
            animateCardMove({
              moveParams,
              duration: 350
            }),
            animateCardMove({
              moveParams: fromLayoutParams,
              duration: 150
            }),
            await animateCardFlip({
              card: openedPileCard,
              flipTo: flipOpenedCardTo,
              duration: 150
            })
          ]);
        } catch (e) {
          console.warn(e);
          from.layout();
          to.layout();
          if (openedPileCard) {
            openedPileCard.flip(flipOpenedCardTo);
          }
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
        const { card, to: from, from: to, durationMs, fromIndex } = move.data;
        const { flipDuration, moveDuration, fromLayoutDuration } = getMagicDurations(durationMs);

        try {
          from.removeCard(card);
          to.placeCards(card, fromIndex);

          const moveParams = layoutForAnimation({
            cards: [card],
            layout: () => to.layout(),
          });

          const fromLayoutParams = layoutForAnimation({
            cards: from.cards,
            layout: () => from.layout(),
          });

          await Promise.all([
            animateCardMove({
              moveParams,
              duration: moveDuration,
            }),
            animateCardMove({
              moveParams: fromLayoutParams,
              duration: fromLayoutDuration,
            }),
          ]);

          await animateCardFlip({
            card,
            flipTo: "back",
            duration: flipDuration,
          });
        } catch (e) {
          console.warn(e);
          from.layout();
          to.layout();
        }
        break;
      }
    }
  }

}

function getMagicDurations(durationMs: number) {

  return {
    liftDuration: durationMs * 0.2,
    flipDuration: durationMs * 0.2,
    moveDuration: durationMs * 0.6,
    fromLayoutDuration: 0.2,
  };
}
