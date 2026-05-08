import {TransferFlipCardsMove, TransferFlipCardsMoveStep, CardTransferMove, FlipMove} from "../../models";
import { runFlipLogic, runInstantTransfer } from "../utils/instantExeMoves";
import { invertPlayerMove } from "../utils/invertPlayerMove";

/**
 * Моментальный Исполнитель ходов без анимаций
 */
export class InstantCardsGameMoveExecutor {
  constructor() {}

  applyMove(move: TransferFlipCardsMove): TransferFlipCardsMove {
    if (move.steps.length === 0) return move;
    for (const step of move.steps) {
      this.applyStep(step);
    }
    return move;
  }

  undoMove(move: TransferFlipCardsMove): TransferFlipCardsMove {
    const undoMove = invertPlayerMove(move);
    this.applyMove(undoMove);
    return move;
  }

  // ──────────────────────────────────────────────────────────────

  protected applyStep(step: TransferFlipCardsMoveStep): void {
    switch (step.type) {
      case "cardTransfer":
        this.applyTransfer(step);
        break;
      case "flip":
        this.applyFlip(step);
        break;
    }
  }

  protected applyTransfer(step: CardTransferMove) {
    const { from, to } = step;
    /** исполняем логику  **/
    runInstantTransfer(step);

    /** исполняем визуал **/
    from.layout();
    to.layout();
  }

  protected applyFlip(step: FlipMove) {
    /** исполняем логику и визуал одновременно  **/
    runFlipLogic(step);
  }
}
