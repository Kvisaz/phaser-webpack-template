import { CardSide, IAbstractCard, ICardStack } from "../abstract_types";
import { animateCardFlip, animateCardMove, layoutForAnimation } from "../CardAnimations/cardAnimations";

interface ICardMoverProps {

}

interface ICardMoveCommand {
  cards: IAbstractCard[];
  // это по сути скорость макетирования в стек
  moveDuration: number;
  fromLayoutDuration?: number;
  fromStack: ICardStack<IAbstractCard>;
  toStack: ICardStack<IAbstractCard>;
  fromIndex?: number;
  toIndex?: number;
}

interface ICardFlipCommand {
  cards: IAbstractCard[];
  side: CardSide;
  duration: number;
}

/**
 * @deprecated
 * Не используй `ICommand` в новых игровых фичах.
 * Вместо него используй typed-move подход через `game-mover-core`:
 * `src/common/games/game-mover-core/README.md`
 */
export interface ICommand {
  isNotForHistory?: boolean;
  /** если у этой команды устанаовлен флаг
   * - после ее undo автоматически срабатывает следующее undo **/
  undoBatch?: boolean;
  move?: ICardMoveCommand;
  flip?: ICardFlipCommand;
}

/**
 * @deprecated
 * Не используй `CardStackMover` в новых игровых фичах.
 *
 * Причина:
 * - контракт слишком общий и не отражает типы конкретной игры;
 * - rollback-логика спрятана и плохо масштабируется для сложных ходов.
 *
 * Рекомендуемая замена:
 * - `GenericGameMover<TMove>` + game-specific executor (`execute/rollback`)
 * - подробности и примеры:
 *   `src/common/games/game-mover-core/README.md`
 */
export class CardStackMover {

  private history: ICommand[];

  constructor(private props: ICardMoverProps) {
    this.history = [];
  }

  /** цепочка команд как одно действие при undo
   * пример - [move, flip]
   *  **/
  public async do(commands: ICommand | (ICommand | undefined)[]) {
    const isArray = Array.isArray(commands);
    /** isArray **/
    if (isArray) {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (!command) continue;
        /** все после первой склеиваются с первой при отмене **/
        await this.doCommand({
          ...command,
          undoBatch: command.undoBatch ?? i !== 0
        });
      }
      return;
    }

    /** singleCommand **/
    const singleCommand = commands;
    await this.doCommand(singleCommand);
  }

  public async doCommand(command: ICommand) {
    let commandForHistory: ICommand = command;

    if (command.move) {
      const normalizedMove = this.normalizeMoveCommand(command.move);
      await this.move(normalizedMove);
      commandForHistory = {
        ...command,
        move: normalizedMove,
      };
    }

    if (command.flip) {
      await this.flip(command.flip);
    }

    if (command.isNotForHistory !== true) {
      this.history.push(commandForHistory);
    }
  }

  private async flip(command: ICardFlipCommand) {
    const { cards, side, duration } = command;
    const promises = cards.map(card => animateCardFlip({
      card,
      flipTo: side,
      duration
    }));
    try {
      await Promise.all(promises);
      return true;
    } catch (e) {
      console.warn("error during flip", e);
      cards.forEach(card => card.flip(side));
      return true;
    }
  }

  private async move(command: ICardMoveCommand): Promise<boolean> {
    const { cards, fromStack, toStack, moveDuration, fromLayoutDuration, toIndex } = command;
    /** логика - убираем карты из исходного стека **/
    cards.forEach(card => {
      fromStack.removeCard(card);
    });

    /** логика - вносим карты в другой стек на верхнее место **/
    toStack.placeCards(cards, toIndex);

    /**  проводим лейаут для исходного стека **/
    const fromLayoutParams = layoutForAnimation({
      cards: fromStack.cards, layout: () => fromStack.layout()
    });

    /** делаем лейаут для целевого стека запоминая разницу между позициями **/
    const moveParams = layoutForAnimation({
      cards, layout: () => toStack.layout()
    });

    /** если не анимировано - финиш **/
    if (moveDuration === 0) return true;

    /** делаем анимацию на основе разницы **/
    await Promise.all([
      animateCardMove({
        moveParams,
        duration: moveDuration
      }),
      animateCardMove({
        moveParams: fromLayoutParams,
        duration: fromLayoutDuration ?? 0
      })
    ]);

    return true;
  }

  /**
   * Отменяет последнюю команду из истории,
   * если следующая команда содержит undoBatch=true - отменяет и ее
   * **/
  public async undo() {
    /** берем последнюю команду **/
    let lastCommand = this.history.pop();
    if (!lastCommand) return false;

    /** составляем цепь из последней команды и всех следующих, которые  undoBatch **/
    const undoCommands: ICommand[] = [];
    while (lastCommand) {
      const undoCommand: ICommand = {
        ...invertCommandDirection({ ...lastCommand }),
        isNotForHistory: true
      };
      undoCommands.push(undoCommand);
      lastCommand = lastCommand.undoBatch && this.last != null ? this.history.pop() : undefined;
    }

    /** отыгрываем воспроизведение **/
    await this.do(undoCommands);
    return true;
  }

  get historyLength() {
    return this.history.length;
  }

  get hasHistory() {
    return this.historyLength > 0;
  }

  private get last() {
    return this.history[this.history.length - 1];
  }

  private normalizeMoveCommand(command: ICardMoveCommand): ICardMoveCommand {
    if (command.fromIndex != null) return command;

    const fromIndex = command.fromStack.cards.indexOf(command.cards[0]);
    if (fromIndex < 0) return command;

    return {
      ...command,
      fromIndex,
    };
  }

}

function invertCommandDirection({ move, flip }: ICommand): ICommand {
  if (move) {
    const toIndex = move.fromIndex != null && move.fromIndex >= 0 ? move.fromIndex : undefined;
    return {
      move: {
        ...move,
        fromStack: move.toStack,
        toStack: move.fromStack,
        fromIndex: undefined,
        toIndex,
      }
    };
  }

  if (flip) {
    return {
      flip: {
        ...flip,
        side: flip.side === "face" ? "back" : "face"
      }
    };
  }

  console.warn("no command");
  return {};
}
