import { InstantFlipResult, InstantTransferResult } from "../instant";

export interface ICardMoveAnimator {
  applyTransferAnimation(instantTransferResult: InstantTransferResult): Promise<void>;

  applyFlipAnimation(instantFlipResult: InstantFlipResult): Promise<void>;
}
