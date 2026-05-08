import { Align, AlignObject, IBoundable } from "@kvisaz/phaser-sugar";
import { CardValue } from "../../cards-classic";

export interface ISpiderTableauSuperLongLayoutOptions extends Record<string, unknown> {
  /** отступ от верхней границы cardPlace до первой визуальной карты */
  marginTop?: number;

  /** шаг (px) для "ступенек" закрытых карт (когда их много) */
  hiddenOffsetY?: number;
  /** сколько закрытых карт показываем ступеньками, остальные начинают накладываться */
  maxHiddenOffsetCards?: number;
  /** дополнительный шаг (px) перед первой открытой картой (после скрытой части) */
  firstVisibleOffsetY?: number;

  /** шаг (px) для карт рабочего хвоста (переносимой последовательности) */
  workTailOffsetY?: number;

  /** шаг (px) для открытых карт вне хвоста (компактная часть) */
  collapsedOffsetY?: number;
  /** ограничение количества "ступенек" для открытых карт вне хвоста (используется в режиме limit) */
  maxCollapsedOffsetCards?: number;
}

export type SpiderTableauLayoutMode = "mini" | "limit" | "klondike";

export function isSpiderTableauLayoutMode(value: unknown): value is SpiderTableauLayoutMode {
  return value === "mini" || value === "limit" || value === "klondike";
}

export function parseSpiderTableauLayoutMode(
  value: string | null | undefined,
): SpiderTableauLayoutMode | undefined {
  if (value == null) return;
  return isSpiderTableauLayoutMode(value) ? value : undefined;
}

export interface ISpiderTableauSharedOffsets {
  marginTop: number;
  hiddenCount: number;
  tailStartIndex: number;
  openBase: number;
  hiddenOffsetY: number;
  maxHiddenOffsetCards: number;
  workTailOffsetY: number;
  collapsedOffsetY: number;
  maxCollapsedOffsetCards: number;
}

type LayoutCard = AlignObject & {
  isFaceUp?: boolean;
  value?: CardValue;
};

const valueOrder: CardValue[] = [
  "ace",
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  "jack",
  "queen",
  "king",
];

function cardOrder(value: CardValue): number {
  return valueOrder.indexOf(value);
}

function isChainable(top: LayoutCard, bottom: LayoutCard): boolean {
  if (top.value == null || bottom.value == null) return false;
  return cardOrder(top.value) === cardOrder(bottom.value) + 1;
}

function getHiddenCount(cards: LayoutCard[]): number {
  /** В Spider закрытые карты (back) всегда идут подряд сверху колонки. */
  const firstFaceUpIndex = cards.findIndex((c) => c.isFaceUp === true);
  return firstFaceUpIndex >= 0 ? firstFaceUpIndex : cards.length;
}

function getWorkTailStartIndex(cards: LayoutCard[], faceUpStartIndex: number): number {
  if (cards.length === 0) return 0;
  if (faceUpStartIndex >= cards.length) return cards.length;

  let start = cards.length - 1;
  if (cards[start]?.isFaceUp !== true) return cards.length;

  /**
   * "Рабочий хвост" — максимальная цепочка внизу колонки, которая:
   * - полностью faceUp
   * - строго убывает по значению на 1 (масть не учитываем)
   *
   * Это ровно та часть, которая обычно переносима как группа в Пауке.
   */
  for (let i = cards.length - 1; i > faceUpStartIndex; i--) {
    const bottom = cards[i];
    const top = cards[i - 1];
    if (top?.isFaceUp !== true || bottom?.isFaceUp !== true) break;
    if (!isChainable(top, bottom)) break;
    start = i - 1;
  }

  return start;
}

export function applySpiderTableauLayout(items: AlignObject[], inputZone: IBoundable, offsetsY: number[]) {
  const align = new Align(inputZone);
  items.forEach((item, i) => {
    const y = offsetsY[i] ?? 0;
    align.center(item).topIn(item, y);
  });
}

export function calcSpiderTableauSharedOffsets(
  items: AlignObject[],
  options?: ISpiderTableauSuperLongLayoutOptions,
): ISpiderTableauSharedOffsets {
  const cards = items as LayoutCard[];

  const marginTop = options?.marginTop ?? 8;

  const hiddenOffsetY = options?.hiddenOffsetY ?? 8;
  const maxHiddenOffsetCards = Math.max(0, options?.maxHiddenOffsetCards ?? 4);
  const firstVisibleOffsetY = options?.firstVisibleOffsetY ?? 8;

  const workTailOffsetY = options?.workTailOffsetY ?? 32;

  const collapsedOffsetY = options?.collapsedOffsetY ?? 4;
  const maxCollapsedOffsetCards = Math.max(0, options?.maxCollapsedOffsetCards ?? 8);

  const hiddenCount = getHiddenCount(cards);
  const tailStartIndex = getWorkTailStartIndex(cards, hiddenCount);

  /** Скрытую часть ограничиваем по высоте: после N шагов карты начинают накладываться. */
  const hiddenOffsetLimit =
    hiddenCount > 0 ? Math.min(hiddenCount - 1, Math.max(0, maxHiddenOffsetCards - 1)) : 0;
  const hiddenOffset = hiddenOffsetLimit * hiddenOffsetY;

  const hasHidden = hiddenCount > 0;
  /**
   * Базовый Y для открытых карт: добавляем firstVisibleOffsetY только если есть скрытая часть.
   * Иначе не сдвигаем открытую стопку вниз, чтобы не терять вертикальное место при полностью открытой колонке.
   */
  const openBase = marginTop + hiddenOffset + (hasHidden ? firstVisibleOffsetY : 0);

  return {
    marginTop,
    hiddenCount,
    tailStartIndex,
    openBase,
    hiddenOffsetY,
    maxHiddenOffsetCards,
    workTailOffsetY,
    collapsedOffsetY,
    maxCollapsedOffsetCards,
  };
}
