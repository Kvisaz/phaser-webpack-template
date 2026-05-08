import { animateCardFlip } from "../CardAnimations/cardAnimations";
import { ICardFlipAction } from "../index";

export async function exeFlip(command: ICardFlipAction): Promise<void> {
  const { card, side, duration } = command;
  const cards = Array.isArray(card) ? card : [card];
  const promises = cards.map((card) =>
    animateCardFlip({
      card,
      flipTo: side,
      duration,
    }),
  );
  try {
    await Promise.all(promises);
  } catch (e) {
    console.warn("error during flip", e);
    cards.forEach((card) => card.flip(side));
  }
}
