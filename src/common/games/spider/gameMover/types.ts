import { CardSide } from "../../cards-abstract";
import { IGameMoveCommand, IGameMoveExecutor, IGameMover } from "../../game-mover-core";
import { ISpiderCard, ISpiderStack } from "../types";

export interface ISpiderTransferMoveData {
  cards: ISpiderCard[];
  fromStack: ISpiderStack;
  toStack: ISpiderStack;
  moveDuration: number;
  fromLayoutDuration?: number;
  /**
   * Исходный индекс первой карты в `fromStack`.
   * Используется в rollback, чтобы вернуть карту/цепочку в точную позицию.
   */
  fromIndex?: number;
  /**
   * Явный индекс вставки в `toStack` (нужен для редких специальных случаев).
   * Если не указан, карта(ы) кладутся на верх.
   */
  toIndex?: number;
}

export interface ISpiderFlipMoveData {
  cards: ISpiderCard[];
  side: CardSide;
  duration: number;
}

export type SpiderGameMove =
  | { type: "transfer"; data: ISpiderTransferMoveData }
  | { type: "flip"; data: ISpiderFlipMoveData };

export type ISpiderGameMoveCommand = IGameMoveCommand<SpiderGameMove>;
export type ISpiderGameMoveExecutor = IGameMoveExecutor<SpiderGameMove>;
export type ISpiderGameMover = IGameMover<SpiderGameMove>;
