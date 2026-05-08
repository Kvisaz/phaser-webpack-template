import { animateCardFlip, animateCardMove, layoutForAnimation } from "../../cards-abstract";
import { ISpiderStackMap } from "../types";
import { ISpiderGameMoveExecutor, SpiderGameMove } from "./types";

export class SpiderGameMoveExecutor implements ISpiderGameMoveExecutor {
  /**
   * Нужен доступ к stackMap, чтобы после flip сразу пересчитывать layout затронутых колонок.
   * Без этого у Spider возможен визуальный рассинхрон шага карты до следующего пользовательского действия.
   */
  constructor(private readonly stackMap: ISpiderStackMap) {}

  async execute(move: SpiderGameMove): Promise<void> {
    switch (move.type) {
      case "transfer": {
        await this.executeTransfer(move);
        return;
      }
      case "flip": {
        await this.executeFlip(move);
        return;
      }
    }
  }

  async rollback(move: SpiderGameMove): Promise<void> {
    switch (move.type) {
      case "transfer": {
        await this.rollbackTransfer(move);
        return;
      }
      case "flip": {
        await this.rollbackFlip(move);
        return;
      }
    }
  }

  private async executeTransfer(move: Extract<SpiderGameMove, { type: "transfer" }>) {
    const { cards, fromStack, toStack, moveDuration, fromLayoutDuration, toIndex } = move.data;

    cards.forEach((card) => fromStack.removeCard(card));
    toStack.placeCards(cards, toIndex);

    const fromLayoutParams = layoutForAnimation({
      cards: fromStack.cards,
      layout: () => fromStack.layout(),
    });
    const moveParams = layoutForAnimation({
      cards,
      layout: () => toStack.layout(),
    });

    if (moveDuration === 0) return;

    await Promise.all([
      animateCardMove({
        moveParams,
        duration: moveDuration,
      }),
      animateCardMove({
        moveParams: fromLayoutParams,
        duration: fromLayoutDuration ?? 0,
      }),
    ]);
  }

  private async rollbackTransfer(move: Extract<SpiderGameMove, { type: "transfer" }>) {
    const { cards, fromStack, toStack, moveDuration, fromLayoutDuration, fromIndex } = move.data;

    cards.forEach((card) => toStack.removeCard(card));
    fromStack.placeCards(cards, fromIndex);

    const toLayoutParams = layoutForAnimation({
      cards: toStack.cards,
      layout: () => toStack.layout(),
    });
    const moveParams = layoutForAnimation({
      cards,
      layout: () => fromStack.layout(),
    });

    if (moveDuration === 0) return;

    await Promise.all([
      animateCardMove({
        moveParams,
        duration: moveDuration,
      }),
      animateCardMove({
        moveParams: toLayoutParams,
        duration: fromLayoutDuration ?? 0,
      }),
    ]);
  }

  private async executeFlip(move: Extract<SpiderGameMove, { type: "flip" }>) {
    const { cards, side, duration } = move.data;
    const promises = cards.map((card) =>
      animateCardFlip({
        card,
        flipTo: side,
        duration,
      }),
    );
    await Promise.all(promises);
    /**
     * В Spider layout зависит от isFaceUp/isFaceDown.
     * Flip меняет сторону карты, значит после него нужно обязательно перезапустить layout,
     * иначе колонка может остаться в "сжатом" состоянии до ручного drag/drop.
     */
    this.layoutStacksForCards(cards);
  }

  private async rollbackFlip(move: Extract<SpiderGameMove, { type: "flip" }>) {
    const { cards, side, duration } = move.data;
    const inverse = side === "face" ? "back" : "face";
    const promises = cards.map((card) =>
      animateCardFlip({
        card,
        flipTo: inverse,
        duration,
      }),
    );
    await Promise.all(promises);
    /** Для undo действует тот же инвариант: после обратного flip layout нужно пересчитать сразу. */
    this.layoutStacksForCards(cards);
  }

  private layoutStacksForCards(cards: Extract<SpiderGameMove, { type: "flip" }>["data"]["cards"]) {
    /** Дедупликация обязательна: несколько карт могут относиться к одному стеку. */
    const stackIds = new Set(cards.map((card) => card.stackId));
    stackIds.forEach((stackId) => {
      this.stackMap.get(stackId)?.layout();
    });
  }
}
