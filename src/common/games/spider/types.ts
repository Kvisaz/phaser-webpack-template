import { CardSide, IAbstractCard, ICardStack } from "../cards-abstract";
import { CardSuit, CardValue } from "../cards-classic";

export type SpiderSuitsMode = 1 | 2 | 4;

export interface ISpiderStack extends ICardStack<ISpiderCard> {
  type: SpiderStackType;
}

export enum SpiderStackType {
  STOCK = "stock",
  TABLEAU = "tableau",
  FOUNDATION = "foundation",
}

export interface ISpiderStackMap extends Map<string, ISpiderStack> {
  stock: ISpiderStack;
  tableaus: ISpiderStack[];
  foundations: ISpiderStack[];
  all: ISpiderStack[];
}

export interface ISpiderCard extends IAbstractCard {
  flip(to?: CardSide): void;

  type: string;
  value: CardValue;
  suit: CardSuit;
  isFaceUp: boolean;
  setMode(mode: SpiderCardMode): void;
}

export type SpiderCardMode = "dimmed" | "normal";

export type SpiderStacksCreator = () => ISpiderStackMap;

export type SpiderStateStep = "idle" | "animation";

export interface ISpiderExposedState {
  step: SpiderStateStep;
  historyLength: number;

  dealsLeft: number;
  isDealPossible: boolean;
  isUndoPossible: boolean;
  isHintPossible: boolean;
  isMagicPossible: boolean;

  stockCount: number;
  tableauCounts: Array<{ closed: number; open: number }>;

  completedSequences: number;
  totalSequences: number;
  progress: number;
  isCollectPossible: boolean;

  isWin: boolean;
}

export interface ISpiderMagicMove {
  card: ISpiderCard;
  from: ISpiderStack;
  to: ISpiderStack;
  fromIndex: number;
  flipToFace: boolean;
}

export interface ISpiderMoveConfig {
  animationEnabled: boolean;
  moveDuration: number;
  fromLayoutDuration: number;
  dealMoveDuration: number;
  dealFromLayoutDuration: number;
  flipDuration: number;
  isAnimatedFirstDeal: boolean;
  wrongMoveShakeDuration: number;
}

export interface ISpiderConfig {
  suitsMode: SpiderSuitsMode;
  allowMeaninglessHints: boolean;
  allowDealWithEmptyTableau: boolean;
  moveConfig: ISpiderMoveConfig;
}

export type SpiderConfig<TExtra extends object = {}> = ISpiderConfig & TExtra;
