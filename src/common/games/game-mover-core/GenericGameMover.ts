import { IGameMoveCommand, IGameMover, IGameMoverProps } from "./types";

/**
 * GenericGameMover — минимальный исторический раннер для game-specific ходов.
 *
 * Что делает:
 * - исполняет один ход или цепочку ходов;
 * - хранит историю;
 * - умеет undo последнего хода или склеенного undo-блока.
 *
 * Что не делает:
 * - не знает правил игры;
 * - не умеет сам считать обратный ход;
 * - не управляет состоянием outside world кроме вызова executor.
 *
 * Почему так:
 * - остаемся в KISS: общий слой знает только про историю и batching;
 * - конкретная игра полностью контролирует `execute/rollback`.
 */
export class GenericGameMover<TMove> implements IGameMover<TMove> {
  private readonly history: IGameMoveCommand<TMove>[] = [];

  constructor(private readonly props: IGameMoverProps<TMove>) {}

  async run(
    commands: IGameMoveCommand<TMove> | Array<IGameMoveCommand<TMove> | undefined>,
  ): Promise<void> {
    const isArray = Array.isArray(commands);
    if (!isArray) {
      await this.runCommand(commands);
      return;
    }

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;
      await this.runCommand({
        ...command,
        /** По умолчанию склеиваем все элементы массива после первого. */
        undoBatch: command.undoBatch ?? i !== 0,
      });
    }
  }

  async undo(): Promise<boolean> {
    let lastCommand = this.history.pop();
    if (!lastCommand) return false;

    const rollbackCommands: IGameMoveCommand<TMove>[] = [];
    while (lastCommand) {
      rollbackCommands.push({
        ...lastCommand,
        isNotForHistory: true,
      });
      lastCommand = lastCommand.undoBatch && this.last ? this.history.pop() : undefined;
    }

    for (const command of rollbackCommands) {
      await this.props.executor.rollback(command.move);
    }

    return true;
  }

  get historyLength(): number {
    return this.history.length;
  }

  get hasHistory(): boolean {
    return this.historyLength > 0;
  }

  private get last(): IGameMoveCommand<TMove> | undefined {
    return this.history[this.history.length - 1];
  }

  private async runCommand(command: IGameMoveCommand<TMove>): Promise<void> {
    await this.props.executor.execute(command.move);
    if (command.isNotForHistory === true) return;
    this.history.push(command);
  }
}
