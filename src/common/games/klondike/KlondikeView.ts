import { animateCardPop, CardsMoveDealer } from "../cards-abstract";
import {
  IKlondikeCard,
  IKlondikeConfig,
  IKlondikeExposedState,
  IKlondikeGameEvents,
  IKlondikeGameMaster,
  IKlondikeHistoryMove,
  IKlondikeScorer,
  IKlondikeStackMap,
  IKlondikeUserLowLevelInput,
  InGameUserLowLevelInput,
  IStatelessKlondikeAnimator,
  KlondikeGameMove,
  OutGameUserLowLevelInput,
} from "./types";
import { Observable, State, TypedEventsEmitter } from "../../events";
import { debounce } from "../../utils";
import { addKlondikeLowLevelUserInput } from "./addKlondikeLowLevelUserInput";
import { GameReactionsMapper, IKlondikeGameMover, provideGameMover } from "./gameMover";
import { ClassicRussianScorer } from "./score/ClassicRussianScorer";
import { KlondikeRules } from "./rules";
import { KlondikeTricks } from "./KlondikeTricks/KlondikeTricks";
import { KlondikeAutoCompleter } from "./KlondikeAutoCompleter/KlondikeAutoCompleter";
import { GameObject } from "../../interfaces";

interface IProps {
  config: IKlondikeConfig;
  stackMap: IKlondikeStackMap;
  cardViews: IKlondikeCard[];

  /** мутирующая функция раздачи карт из deck в рабочие стопки piles,
   * так как это не остается в истории,
   * но не является анимацией без состояния**/
  dealCards: CardsMoveDealer;

  /** все анимации для подсказок, привлечения вниманий,
   * по принципу выстрелил-забыл
   **/
  statelessAnimator: IStatelessKlondikeAnimator;

  /** справочный центр,
   * который определяет, какие ходы доступны игроку,
   * какие подсказки и трюки он может использовать
   * выдает "ход игрока", если возможен
   *
   * описывается и реализуется для конкретной игры
   * **/
  gameMaster: IKlondikeGameMaster;
}

export class KlondikeView {
  // unSub нужен так как мы тестируем в сторибуке в одной сцене и класс должен иметь очистку
  protected unSubs: (() => void)[] = [];

  /** наблюдаемое состояние **/
  protected state: State<IKlondikeExposedState>;

  /** внешний интерфейс наблюдаемого состояния
   * - только с возможностью подписки **/
  get liveState(): Observable<IKlondikeExposedState> {
    return this.state;
  }

  /** внутренний дебаунсер
   * - чтобы не запускать часто вычисления
   * берем последнее за интервал
   * **/
  private readonly debouncedUpdateLiveStateCombos: () => void;

  /** действия игрока, могут идти от внешних систем кстати, не только от userInput **/
  userEvents: TypedEventsEmitter<IKlondikeUserLowLevelInput>;
  /** действия игры **/
  gameEvents: TypedEventsEmitter<IKlondikeGameEvents>;

  /**
   * сердце движка - ходы на поле
   * Не знает о cardStackMap
   * не знает об истории
   * тупой, но может делать отмену
   * **/
  protected readonly gameMover: IKlondikeGameMover;

  /** перевод инпута в игровые ходы**/
  private userInputMapper: GameReactionsMapper;

  /** правила клондайка **/
  protected readonly klondikeRules: KlondikeRules;
  private readonly tricks: KlondikeTricks;
  private readonly autoCompleter: KlondikeAutoCompleter;

  /** оцениватель ходов**/
  protected readonly scorer: IKlondikeScorer;

  /** история ходов, чтобы отменять**/
  protected readonly playerMoveHistory: IKlondikeHistoryMove[];

  constructor(protected props: IProps) {
    const { cardViews, stackMap, config } = props;
    this.klondikeRules = new KlondikeRules({ stackMap });
    this.tricks = new KlondikeTricks({
      stackMap,
      klondikeRules: this.klondikeRules,
      tricksConfig: config.tricksConfig,
    });
    this.autoCompleter = new KlondikeAutoCompleter({
      stackMap,
      klondikeRules: this.klondikeRules,
      runMove: (move) => this.runMove(move),
    });
    this.unSubs.push(() => cardViews.forEach((cardView) => cardView.destroy()));

    this.gameEvents = new TypedEventsEmitter();
    this.userEvents = new TypedEventsEmitter();
    this.unSubs.push(
      () => this.userEvents.unSubscribeAll(),
      () => this.gameEvents.unSubscribeAll(),
    );

    this.gameMover = provideGameMover({
      moveConfig: props.config.moveConfig,
      stackMap,
      klondikeRules: this.klondikeRules,
    });

    this.userInputMapper = new GameReactionsMapper({
      stackMap: props.stackMap,
      klondikeTricks: this.tricks,
    });

    this.scorer = new ClassicRussianScorer({});

    this.playerMoveHistory = [];

    this.state = new State<IKlondikeExposedState>({
      historyLength: 0,
      score: 0,
      isAutoCompletePossible: false,
      step: "idle",
    });
    this.unSubs.push(() => this.state.unSubScribeAll());

    this.debouncedUpdateLiveStateCombos = debounce(this.updateLiveStateCombos.bind(this), 100);

    stackMap.deck.placeCards(cardViews);
    stackMap.deck.layout();

    this.unSubs.push(() =>
      stackMap.all.forEach((stack) => {
        stack.cardPlace.destroy();
      }),
    );

    this.props
      .dealCards(stackMap.deck, stackMap.piles, this.props.config.dealConfig)
      .then(() => {
        this.gameEvents.emit("onDealFinish");
        this.debouncedUpdateLiveStateCombos();
        this.addUserInput();
      })
      .catch(console.warn);
  }

  destroy() {
    this.unSubs.forEach((unSub) => unSub());
  }

  public async runAutoCompleteAnimation(): Promise<void> {
    this.setStep("autoCompleting");
    try {
      await this.autoCompleter.runAutoCompleteAnimation();
    } finally {
      this.setStep("idle");
    }
  }

  private addUserInput() {
    const { cardViews, stackMap, gameMaster } = this.props;

    /** низко уровневая обработка рабы с мокшйо **/
    addKlondikeLowLevelUserInput({
      stackMap,
      cardViews,
      isDraggable: gameMaster.isDraggable.bind(gameMaster),
      isDroppable: gameMaster.isDroppable.bind(gameMaster),
      getPileMovableCards: gameMaster.getPileMovableCards.bind(gameMaster),
      userInputEvents: this.userEvents,
    });

    /** low-level signal - to player moves **/
    this.addHighLevelUserInput();
  }

  private addHighLevelUserInput() {
    const { userEvents } = this;
    /**
     * следи за тем
     * чтобы эти вещи не запускались одновременно
     **/
    userEvents.on("onCardClick", (data) => {
      this.onInGameUserInput("onCardClick", data);
    });
    userEvents.on("onDeckClick", (data) => {
      this.onInGameUserInput("onDeckClick", data);
    });
    userEvents.on("onCardDrop", (data) => {
      this.onInGameUserInput("onCardDrop", data);
    });

    /** события от внешних кнопок или чего-то еще**/
    const outerEvents: (keyof OutGameUserLowLevelInput)[] = [
      "onUndoClick",
      "onVisionClick",
      "onHintClick",
      "onMagicClick",
    ];
    outerEvents.forEach((outEvent) => {
      userEvents.on(outEvent, (data) => this.onOutGameUserInput(outEvent, data));
    });
  }

  private onInGameUserInput<K extends keyof InGameUserLowLevelInput>(
    event: K,
    data: InGameUserLowLevelInput[K],
  ) {
    const move = this.userInputMapper.mapUserActionToMove(event, data);
    this.runMoveWithStep(move).catch(console.warn);
  }

  private onOutGameUserInput<K extends keyof OutGameUserLowLevelInput>(
    event: K,
    data: OutGameUserLowLevelInput[K],
  ) {
    switch (event) {
      case "onUndoClick":
        this.undoLastMove().catch(console.warn);
        break;
      case "onHintClick": {
        const { durationMs } = data as OutGameUserLowLevelInput["onHintClick"];
        this.onHint(durationMs).catch(console.warn);
        break;
      }
      case "onMagicClick": {
        const { durationMs } = data as OutGameUserLowLevelInput["onMagicClick"];
        this.onMagic(durationMs).catch(console.warn);
        break;
      }
      case "onVisionClick": {
        const { durationMs } = data as OutGameUserLowLevelInput["onVisionClick"];
        this.onVision(durationMs).catch(console.warn);
        break;
      }
    }
  }

  /** ход вперед в истории
   *  вот сюда вкорячивай оценки, истории и так далее
   *  **/
  private async runMove(move: KlondikeGameMove) {
    this.gameEvents.emit("playerCardsMoveStart", move);
    const scoreInc = this.scorer.scoreMove(move);
    if (scoreInc !== 0) {
      this.state.setState((prev) => ({ ...prev, score: this.getNewScore(scoreInc) }));
    }
    await this.gameMover.run(move);

    if (this.isHistoryMove(move)) {
      this.playerMoveHistory.push({ move, scoreInc });
      this.state.setState((prev) => ({ ...prev, historyLength: this.playerMoveHistory.length }));
    }
    this.gameEvents.emit("playerCardsMoveFinish", move);
    this.debouncedUpdateLiveStateCombos();
    this.checkGameCompletion();
  }

  private async runMoveWithStep(move: KlondikeGameMove): Promise<void> {
    this.setStep("animation");
    try {
      await this.runMove(move);
    } finally {
      this.setStep("idle");
    }
  }

  private getNewScore(scoreInc: number): number {
    const prev = this.state.getState().score;
    return Math.max(0, prev + scoreInc);
  }

  private isHistoryMove(move: KlondikeGameMove): boolean {
    return (
      move.type === "transfer" ||
      move.type === "pickDeckCard" ||
      move.type === "deckRecycle" ||
      move.type === "magic"
    );
  }

  private async undoLastMove() {
    const lastMoveState = this.playerMoveHistory.pop();
    if (lastMoveState == null) {
      return;
    }
    this.setStep("animation");
    this.gameEvents.emit("undoStart", lastMoveState);
    try {
      const { move, scoreInc } = lastMoveState;
      await this.gameMover.undo(move);
      this.state.setState((prev) => ({
        ...prev,
        historyLength: this.playerMoveHistory.length,
        score: this.getNewScore(-scoreInc),
      }));
    } catch (e) {
      console.warn(e);
    }
    this.gameEvents.emit("undoFinish", lastMoveState);
    this.setStep("idle");

    this.debouncedUpdateLiveStateCombos();
  }

  /** используй
   * через debouncedUpdateLiveStateCombos **/
  private updateLiveStateCombos() {
    try {
      const magicCombo = this.tricks.getPilesHiddenGoodCard();
      const hintCombo = this.tricks.getHintCard();

      this.tricks.getHintCardFromChains();

      const hiddenPileCards = this.tricks.getHiddenPileCards();
      const visionCombo = hiddenPileCards.length > 0 ? hiddenPileCards : undefined;
      const isAutoCompletePossible = this.autoCompleter.isAutoCompletePossible();
      this.state.setState((prev) => ({
        ...prev,
        magicCombo,
        hintCombo,
        visionCombo,
        isAutoCompletePossible,
      }));
    } catch (e) {
      console.warn(e);
    }
  }

  private async onHint(durationMs: number) {
    const hintCombo = this.state.getState().hintCombo;
    if (hintCombo == null) {
      console.warn("hintCombo==null");
      return;
    }

    this.setStep("animation");
    try {
      const cardMovableGroup = this.klondikeRules.getPileMovableCards(hintCombo.card);
      const hintCards = cardMovableGroup.length > 0 ? cardMovableGroup : [hintCombo.card];

      const promises = hintCards.map(async (card) => {
        await animateCardPop({
          card: card as unknown as GameObject,
          scaleAmount: 1.2,
          duration: durationMs,
          repeat: 1,
        });
      });
      await Promise.all(promises);
    } catch (e) {
      console.warn(e);
    }
    this.setStep("idle");
    this.gameEvents.emit("hintFinish");
  }

  private async onVision(durationMs: number) {
    const visionCombo = this.state.getState().visionCombo;
    if (visionCombo == null || visionCombo.length === 0) {
      console.warn("visionCombo==null");
      return;
    }

    this.setStep("animation");
    try {
      await this.props.statelessAnimator.showVision(visionCombo, durationMs);
    } catch (e) {
      console.warn(e);
    }
    this.setStep("idle");
    this.gameEvents.emit("visionFinish");
  }

  private async onMagic(durationMs: number) {
    const magicCombo = this.state.getState().magicCombo;
    if (!magicCombo) {
      console.warn("magicCombo==null");
      return;
    }

    const move: KlondikeGameMove = {
      type: "magic",
      data: {
        card: magicCombo.card,
        from: magicCombo.from,
        to: magicCombo.to,
        fromIndex: magicCombo.from.cards.indexOf(magicCombo.card),
        durationMs,
      },
    };

    await this.runMoveWithStep(move);
    this.gameEvents.emit("magicFinish");
  }

  private setStep(step: IKlondikeExposedState["step"]) {
    this.state.setState((prev) => ({ ...prev, step }));
  }

  private checkGameCompletion() {
    const isCompleted = this.klondikeRules.areAllCardsOnBases();
    if (isCompleted) this.gameEvents.emit("isAllCardsOnBases");
  }
}
