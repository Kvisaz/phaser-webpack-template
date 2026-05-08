import { ILayoutStrategy } from "../../cards-abstract";
import {
  applySpiderTableauLayout,
  calcSpiderTableauSharedOffsets,
  ISpiderTableauSuperLongLayoutOptions,
} from "./utils";

/**
 * Spider tableau layout (mode: "limit")
 *
 * Задача та же, что и у режима "mini": сделать длинные колонки компактнее, чтобы они не "уезжали" за экран,
 * сохранив читаемым и интерактивным рабочий хвост.
 *
 * Отличие от "mini":
 * - "mini" уменьшает шаг для каждой открытой карты вне хвоста, но высота всё равно растёт линейно.
 * - "limit" ограничивает вклад открытых карт вне хвоста в общую высоту:
 *   визуально ступеньками показываем только последние `maxCollapsedOffsetCards`,
 *   а все более верхние открытые карты вне хвоста накладываем друг на друга (offset 0).
 *
 * Важно:
 * - стратегия не меняет игровые правила и не трогает карты (никаких flip/side), она только двигает их по Y.
 *
 * Когда выбирать:
 * - когда реально бывают супердлинные колонки, и даже "mini" продолжает уходить за экран.
 *
 * Минусы:
 * - часть открытых карт вне хвоста будет полностью перекрыта (но это именно "нерабочая" часть колонки).
 *
 * Ключевые настройки:
 * - `maxCollapsedOffsetCards` (default: 8) — сколько "ступенек" оставить для открытых карт вне хвоста;
 * - `collapsedOffsetY` (default: 4) — шаг этих ступенек;
 * - `workTailOffsetY` (default: 32) — шаг рабочего хвоста.
 */
export const spiderTableauLimitNonTailCardsLayoutStrategy: ILayoutStrategy<ISpiderTableauSuperLongLayoutOptions> = (
  items,
  inputZone,
  options,
) => {
  if (items.length < 1) return;

  const {
    marginTop,
    hiddenCount,
    tailStartIndex,
    openBase,
    hiddenOffsetY,
    maxHiddenOffsetCards,
    workTailOffsetY,
    collapsedOffsetY,
    maxCollapsedOffsetCards,
  } = calcSpiderTableauSharedOffsets(items, options);

  const offsetsY: number[] = [];

  /** Сколько открытых карт находится "между" скрытой частью и рабочим хвостом. */
  const openCollapsedCount = Math.max(0, tailStartIndex - hiddenCount);
  /** Сколько из них мы реально покажем "ступеньками" (остальные наложим). */
  const collapsedVisibleCount = Math.min(openCollapsedCount, maxCollapsedOffsetCards);
  /** Ограниченная высота компактной открытой части. */
  const collapsedHeight = collapsedVisibleCount * collapsedOffsetY;
  /** Отступ, с которого начинается рабочий хвост. */
  const tailBase = openBase + collapsedHeight;

  /**
   * Сколько "лишних" открытых карт нужно наложить в одну точку, чтобы высота компактной части не росла.
   * Пример: openCollapsedCount=30, maxCollapsedOffsetCards=8 => overflow=22.
   * Тогда первые 22 карты получат step=0 (все в одну точку), а последние 8 будут ступеньками.
   */
  const overflow = Math.max(0, openCollapsedCount - maxCollapsedOffsetCards);

  for (let i = 0; i < items.length; i++) {
    if (i < hiddenCount) {
      /** Скрытые карты: первые N показываем "ступеньками", дальше накладываем. */
      const hiddenIndex = Math.min(i, Math.max(0, maxHiddenOffsetCards - 1));
      offsetsY[i] = marginTop + hiddenIndex * hiddenOffsetY;
      continue;
    }

    if (i < tailStartIndex) {
      const openIndex = i - hiddenCount;
      /** Для "лишних" открытых карт step=0 (накладываем), для последних — ступеньки. */
      const step = openIndex < overflow ? 0 : openIndex - overflow;
      offsetsY[i] = openBase + step * collapsedOffsetY;
      continue;
    }

    /** Рабочий хвост: нормальный "читаемый" шаг. */
    const tailIndex = i - tailStartIndex;
    offsetsY[i] = tailBase + tailIndex * workTailOffsetY;
  }

  applySpiderTableauLayout(items, inputZone, offsetsY);
};

