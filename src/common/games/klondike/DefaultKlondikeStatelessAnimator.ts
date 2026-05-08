import { animateCardFlip, IAbstractCard, ICardStack } from "../cards-abstract";
import { IStatelessAnimationConfig, IStatelessKlondikeAnimator } from "./types";

/** все анимации для подсказок, привлечения вниманий,
 * по принципу выстрелил-забыл**/
export class DefaultKlondikeStatelessAnimator implements IStatelessKlondikeAnimator {
  constructor(private readonly config?: IStatelessAnimationConfig) {}

  async showHint(card: IAbstractCard, stack: ICardStack): Promise<void> {}

  async showVision(cards: IAbstractCard[], durationMs: number): Promise<void> {
    if (cards.length === 0) return;
    const flipDuration = this.config?.visionFlipDuration ?? 150;
    const showDuration = durationMs;

    const faceDown = cards.filter((card) => !card.isFaceUp);

    await Promise.all(
      faceDown.map((card) => animateCardFlip({ card, flipTo: "face", duration: flipDuration })),
    );

    await new Promise<void>((resolve) => setTimeout(resolve, showDuration));

    await Promise.all(
      faceDown.map((card) => animateCardFlip({ card, flipTo: "back", duration: flipDuration })),
    );
  }
}
