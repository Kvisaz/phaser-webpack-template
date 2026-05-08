/**
 * Обертка над игровым ходом с метаданными истории.
 *
 * Важно:
 * - `move` хранит game-specific ход (тип задает сама игра);
 * - `undoBatch=true` склеивает ход с предыдущим в один undo-блок;
 * - `isNotForHistory=true` позволяет исполнить ход без записи в history (например, при rollback).
 */
export interface IGameMoveCommand<TMove> {
  move: TMove;
  undoBatch?: boolean;
  isNotForHistory?: boolean;
}

/**
 * Исполнитель game-specific ходов.
 *
 * `execute` применяет ход к текущему состоянию игры.
 * `rollback` откатывает ровно тот же ход.
 *
 * Контракт минимальный и намеренно не знает ничего о правилах конкретной игры.
 */
export interface IGameMoveExecutor<TMove> {
  execute(move: TMove): Promise<void>;
  rollback(move: TMove): Promise<void>;
}

/**
 * Унифицированный mover, который:
 * - исполняет команды;
 * - хранит историю;
 * - делает undo по блокам (`undoBatch`).
 */
export interface IGameMover<TMove> {
  run(commands: IGameMoveCommand<TMove> | Array<IGameMoveCommand<TMove> | undefined>): Promise<void>;
  undo(): Promise<boolean>;
  readonly historyLength: number;
  readonly hasHistory: boolean;
}

export interface IGameMoverProps<TMove> {
  executor: IGameMoveExecutor<TMove>;
}
