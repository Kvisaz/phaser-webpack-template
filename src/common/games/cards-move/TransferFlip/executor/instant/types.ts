import { IMoveParams } from "../../../../cards-abstract";
import { Card, CardTransferMove, FlipMove, FlipState } from "../../models";

export interface InstantTransferResult extends CardTransferMove {
  fromLayoutParams: IMoveParams[];
  moveParams: IMoveParams[];
}

export interface InstantFlipResult extends FlipMove {
  cards: Card | Card[];
  from: FlipState;
  to: FlipState;
}
