# game-mover-core

`game-mover-core` — минимальный общий каркас для игр, где нужны:
- выполнение ходов;
- история;
- `undo` с поддержкой batching (`undoBatch`).

Он намеренно не знает правил конкретной игры: правила и формат ходов остаются в game-specific слое.

## Что входит

- `IGameMoveCommand<TMove>` — обертка над ходом + метаданные истории.
- `IGameMoveExecutor<TMove>` — game-specific исполнитель (`execute/rollback`).
- `IGameMover<TMove>` — общий интерфейс раннера с `run/undo`.
- `GenericGameMover<TMove>` — базовая реализация истории и batching.

## Базовый пример (простой)

```ts
type CounterMove = { type: "inc"; value: number };

class CounterExecutor implements IGameMoveExecutor<CounterMove> {
  constructor(private readonly counter: { value: number }) {}

  async execute(move: CounterMove) {
    this.counter.value += move.value;
  }

  async rollback(move: CounterMove) {
    this.counter.value -= move.value;
  }
}

const mover = new GenericGameMover<CounterMove>({
  executor: new CounterExecutor({ value: 0 }),
});

await mover.run({ move: { type: "inc", value: 3 } });
await mover.undo();
```

## Средний пример (цепочка как один undo)

```ts
await mover.run([
  { move: firstMove },
  { move: secondMove }, // undoBatch проставится автоматически
  { move: thirdMove },  // undoBatch проставится автоматически
]);

// Один undo откатит всю цепочку
await mover.undo();
```

## Продвинутый пример (точный rollback с индексом)

```ts
type StackMove =
  | {
      type: "transfer";
      data: { fromIndex?: number; from: Stack; to: Stack; cards: Card[] };
    }
  | {
      type: "flip";
      data: { cards: Card[]; side: "face" | "back" };
    };

class StackExecutor implements IGameMoveExecutor<StackMove> {
  async execute(move: StackMove) {
    if (move.type === "transfer") {
      // ... remove from source, place to target
      return;
    }
    // ... flip cards
  }

  async rollback(move: StackMove) {
    if (move.type === "transfer") {
      // ... remove from target, place back in source at fromIndex
      return;
    }
    // ... flip to inverse side
  }
}
```

## Рекомендации

1. Держи `TMove` game-specific (как `KlondikeGameMove`, `SpiderGameMove`).
2. Не добавляй в core правила игры — только раннер и историю.
3. Если нужен сложный rollback, передавай в ход достаточно данных (`fromIndex`, `duration`, `openedCard`).
4. Для анимированного и instant режима используй отдельные executors и выбирай их фабрикой.

## Когда не использовать

- Когда игра не требует истории/undo.
- Когда проще одноразово сделать прямой imperative flow без команд.
