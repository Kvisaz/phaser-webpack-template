import { animateCardFlip, animateCardMove } from "../../../../cards-abstract";
import { ICardMoveAnimator } from "./types";
import { InstantFlipResult, InstantTransferResult } from "../instant";

interface IProps {
  getMoveDuration: (instantTransferResult: InstantTransferResult) => number;
  getFromLayoutDuration: (instantTransferResult: InstantTransferResult) => number;
  getFlipDuration: (instantFlipResult: InstantFlipResult) => number;
}

export class BasicCardsMoveAnimator implements ICardMoveAnimator {
  constructor(protected props: IProps) {}

  async applyTransferAnimation(instantTransferResult: InstantTransferResult): Promise<void> {
    return applyTransferAnimation(instantTransferResult, {
      layoutFromDuration: this.props.getFromLayoutDuration(instantTransferResult),
      moveDuration: this.props.getMoveDuration(instantTransferResult),
    });
  }

  async applyFlipAnimation(instantFlipResult: InstantFlipResult): Promise<void> {
    return applyFlipAnimation(instantFlipResult, {
      duration: this.props.getFlipDuration(instantFlipResult),
    });
  }
}

export async function applyTransferAnimation(
  instantTransferResult: InstantTransferResult,
  config: {
    moveDuration: number;
    layoutFromDuration: number;
  },
): Promise<void> {
  const { moveParams, fromLayoutParams, from, to, cards } = instantTransferResult;
  const { layoutFromDuration, moveDuration } = config;
  /** делаем анимацию на основе разницы **/
  await Promise.all([
    /** анимация полета карты в новый стек **/
    animateCardMove({
      moveParams,
      duration: moveDuration,
    }),
    /** анимация лейаута исходного стека - ему возможно надо восстановиться **/
    animateCardMove({
      moveParams: fromLayoutParams,
      duration: layoutFromDuration,
    }),
  ]);
}

export async function applyFlipAnimation(
  instantFlipResult: InstantFlipResult,
  config: {
    duration: number;
  },
): Promise<void> {
  const { from, to, cards } = instantFlipResult;
  const { duration } = config;
  const cardsArray = Array.isArray(cards) ? cards : [cards];
  const promises = cardsArray.map((card) =>
    animateCardFlip({
      card,
      flipTo: to.side,
      duration,
    }),
  );
  await Promise.all(promises);
}
