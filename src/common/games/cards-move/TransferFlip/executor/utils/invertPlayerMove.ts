import {TransferFlipCardsMove, TransferFlipCardsMoveStep} from "../../models";

export const invertPlayerMove = (move: TransferFlipCardsMove): TransferFlipCardsMove => {
  return {
    steps: move.steps.reverse().map(step => invertPlayerMoveAtom(step))
  }
}

function invertPlayerMoveAtom<T extends TransferFlipCardsMoveStep>(atom: T): T {
  return {
    from: atom.to,
    to: atom.from
  } as T
}
