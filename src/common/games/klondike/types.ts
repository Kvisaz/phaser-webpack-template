import { CardSide, IAbstractCard, ICardStack } from "../cards-abstract";
import { CardSuit, CardValue } from "../cards-classic";

export interface IKlondikeStack extends ICardStack<IKlondikeCard> {
  type: KlondikeStackType;
}

export enum KlondikeStackType {
  DECK = "deck",
  GRAVE = "grave",
  BASE = "base",
  PILE = "pile",
}

export interface IKlondikeStackMap extends Map<string, IKlondikeStack> {
  deck: IKlondikeStack;
  grave: IKlondikeStack;
  bases: IKlondikeStack[];
  piles: IKlondikeStack[];
  all: IKlondikeStack[];
}

export interface IKlondikeCard extends IAbstractCard {
  flip(to?: CardSide): void;

  type: string;
  value: CardValue;
  suit: CardSuit;
  isFaceUp: boolean;
}

/**
 * Создатель мест для карт
 * на момент создания ему совсем не нужны карты
 * по сути это зоны игрового поля
 * **/
export type KlondikeStacksCreator = () => IKlondikeStackMap;

/** все анимации для подсказок, привлечения вниманий,
 * по принципу выстрелил-забыл**/
export interface IStatelessKlondikeAnimator {
  showHint(card: IAbstractCard, stack: ICardStack): Promise<void>;

  showVision(cards: IAbstractCard[], durationMs: number): Promise<void>;
}
export interface IStatelessAnimationConfig {
  visionFlipDuration: number;
  visionShowDuration: number;
}

/** справочный центр,
 * который определяет, какие ходы доступны игроку,
 * какие подсказки и трюки он может использовать
 * выдает "ход игрока", если возможен
 *
 * описывается и реализуется для конкретной игры
 * **/
export interface IKlondikeGameMaster {
  isDraggable(clickedCard: IKlondikeCard): boolean;

  isDroppable(card: IKlondikeCard, dropZone: IKlondikeStack): boolean;

  getPileMovableCards(clickedCard: IKlondikeCard): IKlondikeCard[];
}

/** input игрока в игровом компоненте **/
export interface InGameUserLowLevelInput {
  onCardClick: { card: IKlondikeCard };
  onDeckClick: { deck: IKlondikeStack };
  onCardDrop: { cards: IKlondikeCard[]; toStack: IKlondikeStack | undefined };
}

/** input игрока за его пределами - в UI **/
export interface OutGameUserLowLevelInput {
  onHintClick: { durationMs: number };
  onUndoClick: void;
  onMagicClick: { durationMs: number };
  onVisionClick: { durationMs: number };
}
export type OutGameUserLowLevelInputEventsArray = (keyof OutGameUserLowLevelInput)[];


/** События от игрока!
 * ИГРОК ===> ИГРА
 * Это и только это выглядит достаточным базисом для эвентов
 **/
export interface IKlondikeUserLowLevelInput extends InGameUserLowLevelInput, OutGameUserLowLevelInput{
}

/** реакция игры на действия игрока **/
export type KlondikeGameMove =
  /** плохо выбранная карта при клике или начале драггинга  - реакция негатива**/
  | { type: "wrongCard"; data: { card: IKlondikeCard, from: IKlondikeStack  } }
  /** плохая дроп зона или нет такой - восстановить fromStack **/
  | { type: "wrongDrop"; data: { cards: IKlondikeCard[]; from: IKlondikeStack } }
  /** перенос карты между стопками, все хорошо **/
  | { type: "transfer"; data: { cards: IKlondikeCard[];
    from: IKlondikeStack; to: IKlondikeStack;
    openedPileCard?: IKlondikeCard;
    durationMs?: number;
  } }
  /** открыть карту с колоды **/
  | { type: "pickDeckCard"; data: { from: IKlondikeStack; to: IKlondikeStack; card: IKlondikeCard; durationMs?: number } }
  /** перелистать колоду **/
  | { type: "deckRecycle"; data: { deck: IKlondikeStack; grave: IKlondikeStack; durationMs?: number } }
  /** магический перенос с автоподбором цели **/
  | { type: "magic"; data: { card: IKlondikeCard; from: IKlondikeStack; to: IKlondikeStack; durationMs: number; fromIndex: number } }
  /** что-то невероятное **/
  | { type: "unacceptableMove"; };

/**
 * события ОТ игры
 * ИГРА ===> кто хочет слушай
 **/
export interface IKlondikeGameEvents {
  /** окончание раздачи **/
  onDealFinish: void;
  /** все карты собраны на базах - победа **/
  isAllCardsOnBases: void;
  /**
   * ход игрока - реакция игры, не путать с кликами игрока
   * - засчитываются автоходы
   * - засчитывается магия
   * - засчитываются флипы
   * и прочие ходы меняющие состояние карты
   * - как правило анимированные ходы - не забудь блокировтаь input
   * **/
  playerCardsMoveStart: KlondikeGameMove;

  /**
   * - разблокиовтаь ввод
   **/
  playerCardsMoveFinish: KlondikeGameMove;

  undoStart: IKlondikeHistoryMove;
  undoFinish: IKlondikeHistoryMove;
  hintFinish: void;
  visionFinish: void;
  magicFinish: void;

  scoreInc: number;
}

export interface IKlondikeMoveDealerConfig {
  shuffling?: boolean;
  layoutFromDuration: number;
  moveDuration: number;
  flipDuration: number;
  cardStepDuration: number;
}

export interface IKlondikeMoveConfig {
  animationEnabled: boolean;
  pickDeckCardMoveDuration: number;
  pickDeckCardFlipDuration: number;
  deckRecycleDuration: number;
  transferMoveDuration: number;
  transferFromLayoutDuration: number;
  transferPileFlipDuration: number;
  wrongCardShakeDuration: number;
  magicLiftDuration?: number;
  magicFlipDuration?: number;
  magicMoveDuration?: number;
  magicFromLayoutDuration?: number;
}

export interface IKlondikeConfig {
  moveConfig: IKlondikeMoveConfig;
  statelessAnimationConfig?: IStatelessAnimationConfig;
  dealConfig?: IKlondikeMoveDealerConfig;
  tricksConfig?: {
    /** если true
     * - воспринимает клик по pile как приказ взять из нее максимальную стопку
     * если false - отсчитывает только с этой карты
     * **/
    autoMoveMaximize?: boolean;
  }
}

/** Удобный тип для расширения конфига конкретной игрой своими опциями. */
export type KlondikeConfig<TExtra extends object = {}> = IKlondikeConfig & TExtra;

export interface IKlondikeScorer {
  scoreMove(move:KlondikeGameMove):number;
}

export interface IKlondikeHistoryMove { move: KlondikeGameMove, scoreInc: number }

export type KlondikeStateStep =
  'idle' | 'animation' | 'autoCompleting';

export interface IKlondikeExposedState {
  historyLength: number;
  score: number;
  magicCombo?: IMagicCombo;
  hintCombo?: IHintCombo;
  visionCombo?: IKlondikeCard[];
  isAutoCompletePossible: boolean;
  step: KlondikeStateStep;
}

export interface IMagicCombo {
  card: IKlondikeCard;
  from: IKlondikeStack;
  to: IKlondikeStack;
}

export interface IHintCombo {
  card: IKlondikeCard;
  from: IKlondikeStack;
  to: IKlondikeStack;
}

export interface IVisionCombo {
  cards: IKlondikeCard[];
  isPossible: boolean;
}
