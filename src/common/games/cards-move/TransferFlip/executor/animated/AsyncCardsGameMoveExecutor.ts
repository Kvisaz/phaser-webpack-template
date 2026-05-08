import { runFlipLogic, runInstantTransfer } from "../utils/instantExeMoves";
import { TransferFlipCardsMove, TransferFlipCardsMoveStep, CardTransferMove, FlipMove } from "../../models";
import { InstantFlipResult, InstantTransferResult } from "../instant";
import { invertPlayerMove } from "../utils/invertPlayerMove";

interface IProps {
  applyTransferAnimation(instantTransferResult: InstantTransferResult): Promise<void>;

  applyFlipAnimation(instantFlipResult: InstantFlipResult): Promise<void>;
}

/**
 * Исполнитель ходов
 * Ничего не знает про анимации, только чистая логика.
 */
export class AsyncCardsGameMoveExecutor {
  constructor(protected props: IProps) {}

  async applyMove(move: TransferFlipCardsMove): Promise<TransferFlipCardsMove> {
    if (move.steps.length === 0) return move;
    for (const step of move.steps) {
      await this.applyStep(step);
    }
    return move;
  }

  async undoMove(move: TransferFlipCardsMove): Promise<TransferFlipCardsMove> {
    const undoMove = invertPlayerMove(move);
    await this.applyMove(undoMove);
    return move;
  }

  // ──────────────────────────────────────────────────────────────

  protected async applyStep(step: TransferFlipCardsMoveStep): Promise<void> {
    switch (step.type) {
      case "cardTransfer":
        await this.applyTransfer(step);
        break;
      case "flip":
        await this.applyFlip(step);
        break;
    }
  }

  protected async applyTransfer(step: CardTransferMove) {
    /** исполняем логику  **/
    const instantTransferResult = runInstantTransfer(step);
    /** исполняем визуал **/
    await this.props.applyTransferAnimation(instantTransferResult);
  }

  protected async applyFlip(step: FlipMove) {
    /** исполняем логику  **/
    runFlipLogic(step);
    /** исполняем визуал **/
    await this.props.applyFlipAnimation(step);
  }
}
