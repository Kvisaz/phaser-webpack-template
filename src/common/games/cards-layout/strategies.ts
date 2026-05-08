import { Align, AlignObject, IBoundable } from "@kvisaz/phaser-sugar";
import { ILayoutStrategy } from "../cards-abstract";
import { getOffsetYcentering, getOffsetYFromTop, getUnlimitedOffsetY } from "./cardOffsets";

/**
 * Раскладывает карты сверху с небольшим смещением
 * */
export const fromTopCardLayoutStrategy: ILayoutStrategy = (items: AlignObject[], inputZone: IBoundable) => {
  if (items.length < 1) return;
  const align = new Align(inputZone);

  items.forEach((item, i) => {
    align.center(item).topIn(item, 5 + getOffsetYFromTop(i));
  });
};

/**
 * Центрирует карты с небольшим смещением по вертикали для эффекта стопки
 * */
export const centeredCardLayoutStrategy: ILayoutStrategy<
  Partial<{
    cardOffset: number;
    offsetCardAmounts: number;
  }>
> = (items: AlignObject[], inputZone: IBoundable, options) => {
  if (items.length < 1) return;

  const align = new Align(inputZone);
  items.forEach((item, i) => {
    align.center(item, 0, getOffsetYcentering(i, options?.cardOffset ?? 3));
  });
};

/**
 * Раскладывает карты со смещением по вертикали без ограничений
 * */
export const unlimitedOffsetYCardLayoutStrategy: ILayoutStrategy<
  Partial<{
    offsetY: number;
  }>
> = (items: AlignObject[], inputZone: IBoundable, options) => {
  if (items.length < 1) return;
  const align = new Align(inputZone);

  items.forEach((item, i) => {
    align.center(item, 0, getUnlimitedOffsetY(i, options?.offsetY));
  });
};

/**
 * Раскладывает карты стопкой сверху вниз, показывая часть каждой карты (веер)
 * */
export const showValueCardFromTopLayoutStrategy: ILayoutStrategy<
  Partial<{
    offsetY: number;
    marginTop: number;
  }>
> = (items: AlignObject[], inputZone: IBoundable, options) => {
  if (items.length < 1) return;
  const align = new Align(inputZone);

  const marginTop = options?.marginTop ?? 8;
  const offsetY = options?.offsetY ?? 42;
  items.forEach((item, i) => {
    align.center(item).topIn(item, marginTop + offsetY * i);
  });
};

/**
 * Расклад с ограничением высоты закрытых карт.
 * Закрытые карты смещаются с лимитом, открытые - обычным offsetY.
 */
export const limitedHiddenCardLayoutStrategy: ILayoutStrategy<
  Partial<{
    visibleOffsetY: number;
    firstVisibleOffsetY: number;
    hiddenOffsetY: number;
    maxHiddenOffsetCards: number;
    marginTop: number;
  }>
> = (items: AlignObject[], inputZone: IBoundable, options) => {
  if (items.length < 1) return;
  const align = new Align(inputZone);

  const marginTop = options?.marginTop ?? 8;
  const visibleOffsetY = options?.visibleOffsetY ?? 42;
  const firstVisibleOffsetY = options?.firstVisibleOffsetY ?? visibleOffsetY;
  const hiddenOffsetY = options?.hiddenOffsetY ?? 8;
  const maxHiddenOffsetCards = Math.max(0, options?.maxHiddenOffsetCards ?? 4);

  const cards = items as unknown as { isFaceUp?: boolean }[];
  const firstFaceUpIndex = cards.findIndex((card) => card?.isFaceUp === true);
  const hiddenCount = firstFaceUpIndex >= 0 ? firstFaceUpIndex : items.length;

  const hiddenOffsetLimit = Math.max(0, Math.min(hiddenCount - 1, maxHiddenOffsetCards - 1));
  const hiddenOffset = hiddenCount > 0 ? hiddenOffsetLimit * hiddenOffsetY : 0;
  const visibleBase = marginTop + hiddenOffset + (hiddenCount > 0 ? firstVisibleOffsetY : 0);

  items.forEach((item, i) => {
    let offsetY: number;
    if (i < hiddenCount) {
      const hiddenIndex = Math.min(i, Math.max(0, maxHiddenOffsetCards - 1));
      offsetY = marginTop + hiddenIndex * hiddenOffsetY;
    } else {
      const visibleIndex = i - hiddenCount;
      offsetY = visibleBase + visibleOffsetY * visibleIndex;
    }
    align.center(item).topIn(item, offsetY);
  });
};

export interface IAdaptiveHiddenVisibleCardLayoutOptions extends Record<string, unknown> {
  visibleOffsetY?: number;
  firstVisibleOffsetY?: number;
  hiddenOffsetY?: number;
  maxHiddenOffsetCards?: number;
  marginTop?: number;
  maxHeight?: number;
  bottomBoundaryY?: number;
}

/**
 * Адаптивная стратегия для стопки с поддержкой открытых/закрытых карт:
 * - закрытые (`isFaceUp=false`) раскладываются компактным шагом `hiddenOffsetY` с лимитом `maxHiddenOffsetCards`;
 * - открытые (`isFaceUp=true`) раскладываются шагом `visibleOffsetY`;
 * - при переполнении по высоте стратегия сжимает оба шага пропорционально, сохраняя форму раскладки.
 *
 * Ограничение высоты задается одним из способов:
 * - `maxHeight` — фиксированная высота;
 * - `bottomBoundaryY` — нижняя граница в абсолютной Y-координате;
 * - если заданы оба, применяется более строгий (меньший) лимит.
 *
 * Характеристики:
 * - Сложность: O(n) по числу карт.
 * - Память: O(1) дополнительная.
 * - Нагрузка: низкая при вызове в момент layout/resize (не per-frame).
 * - Мемоизация: не используется.
 *
 *  todo внимание проверить!
 *  Account for top margin in adaptive tableau height clamp
 * When bottomBoundaryY/maxHeight is used,
 * availableSpread is computed as maxLayoutHeight - cardHeight,
 * but every card position still adds marginTop (topIn(item, marginTop + ...)).
 * This means long tableau stacks can still overflow the requested bottom boundary by marginTop (8px by default),
 * so the new adaptive layout does not fully keep the last card visible on constrained screens.
 * Subtract marginTop in the available spread calculation to enforce the boundary correctly.
 */
export const adaptiveHiddenVisibleCardLayoutStrategy: ILayoutStrategy<IAdaptiveHiddenVisibleCardLayoutOptions> = (
  items,
  inputZone,
  options,
) => {
  if (items.length < 1) return;

  const align = new Align(inputZone);
  const marginTop = options?.marginTop ?? 8;
  const visibleOffsetY = options?.visibleOffsetY ?? 42;
  const firstVisibleOffsetY = options?.firstVisibleOffsetY ?? visibleOffsetY;
  const hiddenOffsetY = options?.hiddenOffsetY ?? 8;
  const maxHiddenOffsetCards = Math.max(0, options?.maxHiddenOffsetCards ?? 4);

  const cards = items as unknown as { isFaceUp?: boolean; getBounds(): Phaser.Geom.Rectangle }[];
  const firstFaceUpIndex = cards.findIndex((card) => card?.isFaceUp === true);
  const hiddenCount = firstFaceUpIndex >= 0 ? firstFaceUpIndex : items.length;
  const visibleCount = items.length - hiddenCount;
  const hasVisible = visibleCount > 0;

  const hiddenStepCount = Math.max(0, Math.min(hiddenCount - 1, maxHiddenOffsetCards - 1));
  const hiddenSpread = hiddenStepCount * hiddenOffsetY;
  const firstVisibleSpread = hiddenCount > 0 && hasVisible ? firstVisibleOffsetY : 0;
  const visibleStepCount = Math.max(0, visibleCount - 1);
  const visibleSpread = visibleStepCount * visibleOffsetY;
  const totalSpread = hiddenSpread + firstVisibleSpread + visibleSpread;

  let maxLayoutHeight = options?.maxHeight;
  if (options?.bottomBoundaryY != null) {
    const zoneTop = inputZone.getBounds().top;
    const boundaryHeight = options.bottomBoundaryY - zoneTop;
    maxLayoutHeight = maxLayoutHeight == null ? boundaryHeight : Math.min(maxLayoutHeight, boundaryHeight);
  }

  let scale = 1;
  if (maxLayoutHeight != null && maxLayoutHeight > 0) {
    const cardHeight = cards[0]?.getBounds().height ?? 0;
    const availableSpread = Math.max(0, maxLayoutHeight - cardHeight);
    if (totalSpread > availableSpread && totalSpread > 0) {
      scale = availableSpread / totalSpread;
    }
  }

  const hiddenStep = hiddenOffsetY * scale;
  const firstVisibleStep = firstVisibleOffsetY * scale;
  const visibleStep = visibleOffsetY * scale;
  const visibleBase = marginTop + hiddenStepCount * hiddenStep + (hiddenCount > 0 && hasVisible ? firstVisibleStep : 0);

  items.forEach((item, i) => {
    if (i < hiddenCount) {
      const hiddenIndex = Math.min(i, Math.max(0, maxHiddenOffsetCards - 1));
      align.center(item).topIn(item, marginTop + hiddenIndex * hiddenStep);
      return;
    }

    const visibleIndex = i - hiddenCount;
    align.center(item).topIn(item, visibleBase + visibleIndex * visibleStep);
  });
};

/**
 * Стратегия для сброса в косынке. Последние 3 карты сдвигаются по горизонтали.
 */
export const klondikeGraveLayoutStrategy: ILayoutStrategy<
  Partial<{
    offsetX: number;
  }>
> = (items, inputZone, options) => {
  if (items.length < 1) return;
  const align = new Align(inputZone);
  const offsetX = options?.offsetX ?? 32;

  const fanOutStartIndex = Math.max(0, items.length - 3);

  items.forEach((item, i) => {
    const offsetIndex = Math.max(0, i - fanOutStartIndex);
    align.center(item, offsetIndex * offsetX);
  });
};
