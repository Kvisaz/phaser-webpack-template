import { animateCardPop, animateCardShake } from "../cards-abstract";
import { SceneEvents, State } from "../../events";
import { GameObject } from "../../interfaces";
import { DragDrop } from "../../drag-drop";
import { ISpiderSceneEvents } from "./events";
import { ISpiderGameMoveCommand, ISpiderGameMover, provideSpiderGameMover } from "./gameMover";
import { SpiderRules } from "./rules";
import {
  ISpiderCard,
  ISpiderConfig,
  ISpiderExposedState,
  ISpiderMagicMove,
  ISpiderStack,
  ISpiderStackMap,
  SpiderStateStep,
  SpiderStackType,
} from "./types";

interface IProps {
  scene: Phaser.Scene;
  config: ISpiderConfig;
  stackMap: ISpiderStackMap;
  cardViews: ISpiderCard[];
}

const defaultState: ISpiderExposedState = {
  step: "idle",
  historyLength: 0,
  dealsLeft: 0,
  isDealPossible: false,
  progress: 0,
  isUndoPossible: false,
  completedSequences: 0,
  totalSequences: 0,
  isCollectPossible: false,
  isHintPossible: false,
  isMagicPossible: false,
  stockCount: 0,
  tableauCounts: [],
  isWin: false,
};

export class SpiderView {
  protected unSubs: (() => void)[] = [];
  protected state: State<ISpiderExposedState>;
  private readonly sceneEvents: SceneEvents<ISpiderSceneEvents>;

  private readonly rules: SpiderRules;
  private readonly mover: ISpiderGameMover;
  private logicalHistoryLength = 0;
  private isInitialDealStarted = false;
  private isWinEmitted = false;
  private cachedMagicMove: ISpiderMagicMove | undefined;
  private magicRevision = 0;
  private evaluatedMagicRevision = -1;

  constructor(private readonly props: IProps) {
    const { cardViews, scene, stackMap } = props;

    this.unSubs.push(() => cardViews.forEach((cardView) => cardView.destroy()));

    this.sceneEvents = new SceneEvents<ISpiderSceneEvents>({ scene });
    this.unSubs.push(() => this.sceneEvents.unSubscribeAll());

    this.state = new State<ISpiderExposedState>({ ...defaultState });
    this.unSubs.push(() => this.state.unSubScribeAll());

    this.rules = new SpiderRules({ stackMap, config: props.config });
    this.mover = provideSpiderGameMover(stackMap);

    stackMap.stock.placeCards(cardViews);
    stackMap.stock.layout();
    this.unSubs.push(() => stackMap.all.forEach((stack) => stack.cardPlace.destroy()));

    this.addUserInput();
    this.addHighLevelUserInput();
  }

  destroy() {
    this.unSubs.forEach((unSub) => unSub());
  }

  getState() {
    return this.state.getState();
  }

  startInitialDeal() {
    if (this.isInitialDealStarted) return;
    this.isInitialDealStarted = true;
    /** не пересоздавать инстанс во время анимации раздачи **/
    this.dealInitialLayout().catch(console.warn);
  }

  private async dealInitialLayout() {
    const { moveConfig } = this.props.config;

    if (!moveConfig.animationEnabled || !moveConfig.isAnimatedFirstDeal) {
      this.dealInitialLayoutInstant();
      this.finishInitialDeal();
      return;
    }

    /**
     * На время стартовой раздачи переводим игру в animation-step.
     * Подписчик в SpiderWrap в этот момент отключает scene input.
     **/
    this.setStep("animation");
    try {
      await this.dealInitialLayoutAnimated();
    } finally {
      this.setStep("idle");
    }

    this.finishInitialDeal();
  }

  private dealInitialLayoutInstant() {
    const { stackMap } = this.props;
    const tableaus = stackMap.tableaus;
    const dealCounts = [6, 6, 6, 6, 5, 5, 5, 5, 5, 5];

    dealCounts.forEach((count, tableauIndex) => {
      const tableau = tableaus[tableauIndex];
      if (tableau == null) return;

      for (let i = 0; i < count; i++) {
        const card = stackMap.stock.pickTopCard();
        if (!card) break;
        card.flip("back");
        tableau.placeCards(card);
      }
    });

    tableaus.forEach((tableau) => {
      tableau.topCard?.flip("face");
    });

    stackMap.stock.layout();
    tableaus.forEach((t) => t.layout());
  }

  private async dealInitialLayoutAnimated() {
    const { stackMap, config } = this.props;
    const { moveConfig } = config;
    const dealCounts = [6, 6, 6, 6, 5, 5, 5, 5, 5, 5];
    const maxDealCount = Math.max(...dealCounts);
    const dealAnimation = this.getDealAnimationConfig();

    for (let row = 0; row < maxDealCount; row++) {
      for (let tableauIndex = 0; tableauIndex < dealCounts.length; tableauIndex++) {
        const tableau = stackMap.tableaus[tableauIndex];
        const count = dealCounts[tableauIndex];
        if (tableau == null || count == null || row >= count) continue;

        const card = stackMap.stock.pickTopCard();
        if (card == null) continue;

        card.flip("back");
        await this.mover.run({
          isNotForHistory: true,
          move: {
            type: "transfer",
            data: {
              cards: [card],
              fromStack: stackMap.stock,
              toStack: tableau,
              moveDuration: dealAnimation.moveDuration,
              fromLayoutDuration: dealAnimation.fromLayoutDuration,
            },
          },
        });
        this.sceneEvents.emit("spiderStockDealCardPlace");

        const isLastCardForTableau = row === count - 1;
        if (!isLastCardForTableau) continue;

        await this.mover.run({
          isNotForHistory: true,
          move: {
            type: "flip",
            data: {
              cards: [card],
              side: "face",
              duration: this.withAnimation(moveConfig.flipDuration),
            },
          },
        });
      }
    }
  }

  private finishInitialDeal() {
    this.props.stackMap.all.forEach((stack) => stack.layout());
    this.syncExposedState();
  }

  private addUserInput() {
    const { cardViews, stackMap } = this.props;

    stackMap.stock.cardPlace.setInteractive({ useHandCursor: true });
    stackMap.stock.cardPlace.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      this.sceneEvents.emit("spiderStockClick", { stock: stackMap.stock });
    });

    cardViews.forEach((card) => {
      card.setInteractive({ useHandCursor: true });
    });

    new DragDrop({
      draggables: cardViews,
      dropZones: stackMap.tableaus,
      isDraggable: (draggable) =>
        this.rules.isDraggable(draggable as ISpiderCard, stackMap.get((draggable as ISpiderCard).stackId)),
      isDroppable: (draggable, dropZone) =>
        this.rules.isDroppable(draggable as ISpiderCard, dropZone as ISpiderStack),
      getDraggableGroup: (draggable) => this.rules.getMovableChain(draggable as ISpiderCard),
      onDrop: (args) => {
        this.sceneEvents.emit("spiderCardDrop", {
          cards: args.draggingObjects as ISpiderCard[],
          toStack: args.dropZone as ISpiderStack | undefined,
        });
      },
      onDragObjectPointerUp: (dragObject) => {
        this.sceneEvents.emit("spiderCardClick", { card: dragObject as ISpiderCard });
      },
    });
  }

  private addHighLevelUserInput() {
    const { sceneEvents } = this;

    /**
     * Все внешние команды сходятся сюда.
     * В самих run* методах есть guard по step, чтобы событие не запустило второй ход во время анимации.
     **/
    this.unSubs.push(
      sceneEvents.on("spiderCardDrop", (data) => {
        this.runCardDrop(data.cards, data.toStack).catch(console.warn);
      }),
      sceneEvents.on("spiderCardClick", (data) => {
        this.runCardClick(data.card).catch(console.warn);
      }),
      sceneEvents.on("spiderStockClick", () => {
        this.runDealFromStock().catch(console.warn);
      }),
      sceneEvents.on("spiderUndoRequest", () => {
        this.runUndo().catch(console.warn);
      }),
      sceneEvents.on("spiderHintRequest", () => {
        this.runHint().catch(console.warn);
      }),
      sceneEvents.on("spiderMagicRequest", () => {
        this.runMagic().catch(console.warn);
      }),
      sceneEvents.on("spiderCollectRequest", () => {
        this.runCollectSequences().catch(console.warn);
      }),
    );
  }

  private async runCardClick(card: ISpiderCard): Promise<void> {
    /** удалить при релихзе **/
    console.log(
      `CARD ${card.value} ${card.suit} ${card.side} ${card.stackId}`,
    );

    /**
     * Если идет анимация, новый ход запускать нельзя.
     * Это защищает от реентрантности команд и рассинхронизации истории ходов.
     **/
    if (this.state.getState().step !== "idle") return;

    const { stackMap } = this.props;
    const fromStack = stackMap.get(card.stackId);
    if (fromStack == null) return;

    // Allow clicking the stock card itself, not only its placeholder.
    if (fromStack.type === SpiderStackType.STOCK) {
      await this.runDealFromStock();
      return;
    }

    if (fromStack.type !== SpiderStackType.TABLEAU) return;

    const chain = this.rules.getMovableChain(card);
    if (chain.length === 0) {
      this.emitWrongAutoMove(card);
      return;
    }

    const toStack = this.findAutoMoveTargetTableau(chain[0], fromStack);
    if (toStack == null) {
      this.emitWrongAutoMove(chain[0]);
      return;
    }

    await this.runTransfer(chain, fromStack, toStack);
  }

  private findAutoMoveTargetTableau(movingCard: ISpiderCard, fromStack: ISpiderStack) {
    const { stackMap } = this.props;

    const candidates = stackMap.tableaus.filter(
      (to) => to !== fromStack && this.rules.canMoveToTableau(movingCard, to),
    );

    if (candidates.length === 0) return;

    const nonEmpty = candidates.filter((t) => t.topCard != null);
    const sameSuit = nonEmpty.filter((t) => t.topCard?.suit === movingCard.suit);

    return sameSuit[0] ?? nonEmpty[0] ?? candidates[0];
  }

  private emitWrongAutoMove(card: ISpiderCard) {
    this.sceneEvents.emit("playerCardsMoveStart", { type: "wrongCard" });
    animateCardShake({
      card,
      duration: this.props.config.moveConfig.wrongMoveShakeDuration,
    }).catch(console.warn);
  }

  private async runCardDrop(cards: ISpiderCard[], toStack: ISpiderStack | undefined): Promise<void> {
    if (cards.length === 0) return;

    const { stackMap } = this.props;
    const fromStack = stackMap.get(cards[0].stackId);
    if (fromStack == null) return;

    /**
     * Drop может долететь в момент, когда анимация уже стартовала.
     * В этом случае откатываем визуально drag и не запускаем новый ход.
     **/
    if (this.state.getState().step !== "idle") {
      fromStack.layout();
      toStack?.layout();
      return;
    }

    if (toStack == null || !this.rules.isDroppable(cards[0], toStack)) {
      this.sceneEvents.emit("playerCardsMoveStart", { type: "wrongDrop" });
      fromStack.layout();
      toStack?.layout();
      animateCardShake({
        card: cards[0],
        duration: this.props.config.moveConfig.wrongMoveShakeDuration,
      }).catch(console.warn);
      return;
    }

    await this.runTransfer(cards, fromStack, toStack);
  }

  private async runTransfer(cards: ISpiderCard[], fromStack: ISpiderStack, toStack: ISpiderStack) {
    if (cards.length === 0) return;

    const { config } = this.props;
    const { moveConfig } = config;

    const fromIndex = fromStack.cards.indexOf(cards[0]);
    const revealedCard = fromIndex > 0 ? fromStack.cards[fromIndex - 1] : undefined;

    const commands: ISpiderGameMoveCommand[] = [
      {
        move: {
          type: "transfer",
          data: {
            cards,
            fromStack,
            toStack,
            fromIndex,
            moveDuration: this.withAnimation(moveConfig.moveDuration),
            fromLayoutDuration: this.withAnimation(moveConfig.fromLayoutDuration),
          },
        },
      },
    ];

    if (revealedCard != null && !revealedCard.isFaceUp) {
      commands.push({
        move: {
          type: "flip",
          data: {
            cards: [revealedCard],
            side: "face",
            duration: this.withAnimation(moveConfig.flipDuration),
          },
        },
      });
    }

    /**
     * На весь транзакционный ход (move + auto-collect) держим animation-step,
     * чтобы пользователь не инициировал параллельные действия.
     **/
    this.sceneEvents.emit("playerCardsMoveStart", { type: "transfer" });
    this.setStep("animation");
    try {
      await this.mover.run(commands);
      await this.runAutoCollectSequences();
      this.logicalHistoryLength += 1;
    } finally {
      this.markMagicDirty();
      this.setStep("idle");
    }
  }

  private async runDealFromStock() {
    /**
     * Пока игра в animation-step, раздачу из stock повторно запускать нельзя.
     **/
    if (this.state.getState().step !== "idle") return;

    if (!this.rules.canDealFromStock()) {
      this.sceneEvents.emit("playerCardsMoveStart", { type: "wrongStockDeal" });
      const topCard = this.props.stackMap.stock.topCard;
      if (topCard) {
        animateCardShake({
          card: topCard,
          duration: this.props.config.moveConfig.wrongMoveShakeDuration,
        }).catch(console.warn);
      }
      this.syncExposedState();
      return;
    }

    const { stackMap, config } = this.props;
    const { moveConfig } = config;
    const count = stackMap.tableaus.length;
    const cardsToDeal = stackMap.stock.cards.slice(-count).reverse();
    const dealAnimation = this.getDealAnimationConfig();

    this.sceneEvents.emit("playerCardsMoveStart", { type: "stockDeal" });
    this.setStep("animation");
    let isFirstDealCommand = true;
    try {
      for (let index = 0; index < cardsToDeal.length; index++) {
        const card = cardsToDeal[index];
        const toStack = stackMap.tableaus[index];
        if (card == null || toStack == null) continue;

        const fromIndex = stackMap.stock.cards.indexOf(card);
        if (fromIndex < 0) continue;

        await this.mover.run({
          undoBatch: isFirstDealCommand ? undefined : true,
          move: {
            type: "transfer",
            data: {
              cards: [card],
              fromStack: stackMap.stock,
              toStack,
              fromIndex,
              moveDuration: dealAnimation.moveDuration,
              fromLayoutDuration: dealAnimation.fromLayoutDuration,
            },
          },
        });
        this.sceneEvents.emit("spiderStockDealCardPlace");
        isFirstDealCommand = false;

        if (card.isFaceUp) continue;

        await this.mover.run({
          undoBatch: true,
          move: {
            type: "flip",
            data: {
              cards: [card],
              side: "face",
              duration: this.withAnimation(moveConfig.flipDuration),
            },
          },
        });
      }

      await this.runAutoCollectSequences();
      this.logicalHistoryLength += 1;
    } finally {
      this.markMagicDirty();
      this.setStep("idle");
    }
  }

  private async runUndo() {
    /**
     * Undo допускается только в idle: иначе можно пересечься с незавершенным ходом.
     **/
    if (this.state.getState().step !== "idle") return;
    if (this.logicalHistoryLength <= 0) return;

    this.sceneEvents.emit("playerCardsMoveStart", { type: "undo" });
    this.setStep("animation");
    try {
      const ok = (await this.mover.undo()) === true;
      if (ok) {
        this.logicalHistoryLength = Math.max(0, this.logicalHistoryLength - 1);
        this.markMagicDirty();
        /** Сообщаем сцене об успешном undo: только после этого можно списывать бонус. */
        this.sceneEvents.emit("spiderActionComplete", { action: "undo" });
      }
    } finally {
      this.setStep("idle");
    }
  }

  private async runHint() {
    /**
     * Hint - тоже временная animation-фаза, поэтому повторный вход блокируем.
     **/
    if (this.state.getState().step !== "idle") return;

    const hint = this.rules.findHintMove(this.props.config.allowMeaninglessHints);
    if (!hint) return;

    this.setStep("animation");
    try {
      await Promise.all([
        animateCardPop({ card: hint.cards[0] as unknown as GameObject }),
        animateCardPop({ card: hint.to.cardPlace as unknown as GameObject }),
      ]);
      /** Сообщаем сцене об успешном hint: если подсказки нет, событие не эмитится. */
      this.sceneEvents.emit("spiderActionComplete", { action: "hint" });
    } finally {
      this.setStep("idle");
    }
  }

  private async runCollectSequences() {
    /**
     * Ручной collect выполняем только из idle, чтобы не смешивать батчи команд.
     **/
    if (this.state.getState().step !== "idle") return;

    const collectable = this.rules.findCollectableSequences();
    if (collectable.length === 0) return;

    const { stackMap, config } = this.props;
    const { moveConfig } = config;
    const foundations = stackMap.foundations;

    let nextFoundationIndex = foundations.findIndex((f) => f.length === 0);
    if (nextFoundationIndex < 0) return;

    const commands: ISpiderGameMoveCommand[] = [];
    collectable.forEach(({ from, cards }) => {
      const toStack = foundations[nextFoundationIndex];
      if (toStack == null) return;
      nextFoundationIndex += 1;

      const fromIndex = from.cards.indexOf(cards[0]);
      const revealedCard = fromIndex > 0 ? from.cards[fromIndex - 1] : undefined;

      commands.push({
        move: {
          type: "transfer",
          data: {
            cards,
            fromStack: from,
            toStack,
            fromIndex,
            moveDuration: this.withAnimation(moveConfig.moveDuration),
            fromLayoutDuration: this.withAnimation(moveConfig.fromLayoutDuration),
          },
        },
      });

      if (revealedCard != null && !revealedCard.isFaceUp) {
        commands.push({
          move: {
            type: "flip",
            data: {
              cards: [revealedCard],
              side: "face",
              duration: this.withAnimation(moveConfig.flipDuration),
            },
          },
        });
      }
    });

    this.sceneEvents.emit("playerCardsMoveStart", { type: "collect" });
    this.setStep("animation");
    let ok = false;
    try {
      await this.mover.run(commands);
      await this.runAutoCollectSequences();
      this.logicalHistoryLength += 1;
      ok = true;
    } finally {
      if (ok) this.markMagicDirty();
      this.setStep("idle");
    }
  }

  private async runMagic() {
    /**
     * Magic - полноценный ход, его нельзя запускать поверх другой анимации.
     **/
    if (this.state.getState().step !== "idle") return;

    const magicMove = this.getMagicMove();
    if (!magicMove) return;

    const { moveConfig } = this.props.config;
    const commands: ISpiderGameMoveCommand[] = [
      {
        move: {
          type: "transfer",
          data: {
            cards: [magicMove.card],
            fromStack: magicMove.from,
            toStack: magicMove.to,
            fromIndex: magicMove.fromIndex,
            moveDuration: this.withAnimation(moveConfig.moveDuration),
            fromLayoutDuration: this.withAnimation(moveConfig.fromLayoutDuration),
          },
        },
      },
    ];
    if (magicMove.flipToFace) {
      commands.push({
        move: {
          type: "flip",
          data: {
            cards: [magicMove.card],
            side: "face",
            duration: this.withAnimation(moveConfig.flipDuration),
          },
        },
      });
    }

    this.sceneEvents.emit("playerCardsMoveStart", { type: "magic" });
    this.setStep("animation");
    let ok = false;
    try {
      await this.mover.run(commands);
      await this.runAutoCollectSequences();
      this.logicalHistoryLength += 1;
      ok = true;
    } finally {
      if (ok) {
        this.markMagicDirty();
        /** Сообщаем сцене об успешной magic-команде после завершения move-анимации. */
        this.sceneEvents.emit("spiderActionComplete", { action: "magic" });
      }
      this.setStep("idle");
    }
  }

  private async runAutoCollectSequences(): Promise<void> {
    const { stackMap, config } = this.props;
    const { moveConfig } = config;
    const foundations = stackMap.foundations;

    while (true) {
      const collectable = this.rules.findCollectableSequences();
      if (collectable.length === 0) return;

      let nextFoundationIndex = foundations.findIndex((f) => f.length === 0);
      if (nextFoundationIndex < 0) return;

      const commands: ISpiderGameMoveCommand[] = [];
      collectable.forEach(({ from, cards }) => {
        const toStack = foundations[nextFoundationIndex];
        if (toStack == null) return;
        nextFoundationIndex += 1;

        const fromIndex = from.cards.indexOf(cards[0]);
        const revealedCard = fromIndex > 0 ? from.cards[fromIndex - 1] : undefined;

        commands.push({
          undoBatch: commands.length === 0 ? true : undefined,
          move: {
            type: "transfer",
            data: {
              cards,
              fromStack: from,
              toStack,
              fromIndex,
              moveDuration: this.withAnimation(moveConfig.moveDuration),
              fromLayoutDuration: this.withAnimation(moveConfig.fromLayoutDuration),
            },
          },
        });

        if (revealedCard != null && !revealedCard.isFaceUp) {
          commands.push({
            move: {
              type: "flip",
              data: {
                cards: [revealedCard],
                side: "face",
                duration: this.withAnimation(moveConfig.flipDuration),
              },
            },
          });
        }
      });

      if (commands.length === 0) return;
      await this.mover.run(commands);
    }
  }

  public syncExposedState() {
    const { stackMap } = this.props;
    const step = this.state.getState().step;
    const dealsLeft = this.rules.getDealsLeft();
    const isDealPossible = step === "idle" && this.rules.canDealFromStock();
    const isCollectPossible = step === "idle" && this.rules.findCollectableSequences().length > 0;
    const isHintPossible =
      step === "idle" &&
      this.rules.findHintMove(this.props.config.allowMeaninglessHints) != null;
    const isMagicPossible = step === "idle" && this.getMagicMove() != null;
    const stockCount = stackMap.stock.length;
    const tableauCounts = stackMap.tableaus.map((tableau) => {
      const closed = tableau.cards.filter((card) => !card.isFaceUp).length;
      const open = tableau.cards.length - closed;
      return { closed, open };
    });
    const completedSequences = stackMap.foundations.filter((f) => f.length === 13).length;
    const totalSequences = this.rules.getTotalSequences();
    const progress = totalSequences > 0 ? completedSequences / totalSequences : 0;
    const isWin = completedSequences === totalSequences;
    this.syncNonMovableOpenCardsShade();

    const nextState: ISpiderExposedState = {
      step,
      historyLength: this.logicalHistoryLength,
      dealsLeft,
      isDealPossible,
      isUndoPossible: step === "idle" && this.logicalHistoryLength > 0,
      stockCount,
      tableauCounts,
      completedSequences,
      totalSequences,
      progress,
      isCollectPossible,
      isHintPossible,
      isMagicPossible,
      isWin,
    };
    this.state.setState(nextState);
    this.sceneEvents.emit("spiderStateUpdate", nextState);

    if (isWin && !this.isWinEmitted) {
      this.isWinEmitted = true;
      this.sceneEvents.emit("spiderGameWin");
    }
  }

  private syncNonMovableOpenCardsShade() {
    const { tableaus } = this.props.stackMap;

    tableaus.forEach((tableau) => {
      tableau.cards.forEach((card) => {
        const isNonMovableOpenCard = card.isFaceUp && this.rules.getMovableChain(card).length === 0;
        card.setMode(isNonMovableOpenCard ? "dimmed" : "normal");
      });
    });
  }

  private setStep(step: SpiderStateStep) {
    this.state.setState((prev) => ({
      ...prev,
      step,
    }));
    /**
     * Единая точка смены step: после нее сразу эмитим spiderStateUpdate.
     * SpiderWrap по этому событию включает/выключает scene input.
     **/
    this.syncExposedState();
  }

  private withAnimation(durationMs: number): number {
    return this.props.config.moveConfig.animationEnabled ? durationMs : 0;
  }

  private getDealAnimationConfig() {
    const { moveConfig } = this.props.config;
    return {
      moveDuration: this.withAnimation(moveConfig.dealMoveDuration),
      fromLayoutDuration: this.withAnimation(moveConfig.dealFromLayoutDuration),
    };
  }

  private markMagicDirty() {
    this.magicRevision += 1;
  }

  private getMagicMove(): ISpiderMagicMove | undefined {
    if (this.evaluatedMagicRevision !== this.magicRevision) {
      this.cachedMagicMove = this.rules.findMagicMove();
      this.evaluatedMagicRevision = this.magicRevision;
    }

    return this.cachedMagicMove;
  }
}
