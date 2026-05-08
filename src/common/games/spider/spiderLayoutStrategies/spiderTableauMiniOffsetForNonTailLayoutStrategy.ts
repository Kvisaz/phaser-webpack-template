import { ILayoutStrategy } from "../../cards-abstract";
import {
  applySpiderTableauLayout,
  calcSpiderTableauSharedOffsets,
  ISpiderTableauSuperLongLayoutOptions,
} from "./utils";

/**
 * Spider tableau layout (mode: "mini")
 *
 * Задача: уменьшить высоту длинных колонок, чтобы карты не "уезжали" за экран,
 * но при этом сохранить читаемость и интерактивность "рабочего хвоста".
 *
 * Важно:
 * - стратегия не меняет игровые правила и не трогает карты (никаких flip/side), она только двигает их по Y;
 * - ввод/drag&drop остаётся прежним — мы просто делаем раскладку более компактной.
 *
 * Идея:
 * 1) Находим "рабочий хвост" — максимальную убывающую последовательность внизу колонки,
 *    которая полностью открыта (faceUp). Обычно это то, что можно перетаскивать как группу.
 * 2) Хвост раскладываем нормальным шагом `workTailOffsetY` (читаемо и удобно для перетаскивания).
 * 3) Все открытые карты выше хвоста (которые в переносимую последовательность не входят)
 *    раскладываем маленьким шагом `collapsedOffsetY` — колонка растёт, но намного медленнее.
 * 4) Закрытая часть (hidden) остаётся с лимитом по высоте: показываем "ступеньками" только первые
 *    `maxHiddenOffsetCards`, остальные начинают накладываться (как в `limitedHiddenCardLayoutStrategy`).
 *
 * Когда выбирать:
 * - когда хочется, чтобы "масса" открытых карт была видна ступеньками, но занимала меньше высоты.
 *
 * Минусы:
 * - если открытых карт вне хвоста очень много, высота всё равно может стать большой (просто медленнее).
 *
 * Ключевые настройки:
 * - `collapsedOffsetY` (default: 4) — шаг открытых карт вне хвоста;
 * - `workTailOffsetY` (default: 32) — шаг рабочего хвоста;
 * - `hiddenOffsetY/maxHiddenOffsetCards` — как ограничиваем закрытую часть.
 */
export const spiderTableauMiniOffsetForNonTailLayoutStrategy: ILayoutStrategy<ISpiderTableauSuperLongLayoutOptions> = (
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
  } = calcSpiderTableauSharedOffsets(items, options);

  const offsetsY: number[] = [];

  /** Сколько открытых карт находится "между" скрытой частью и рабочим хвостом. */
  const openCollapsedCount = Math.max(0, tailStartIndex - hiddenCount);
  /** Высота компактной открытой части (в этой стратегии она растёт линейно). */
  const collapsedHeight = openCollapsedCount * collapsedOffsetY;
  /** Отступ, с которого начинается рабочий хвост. */
  const tailBase = openBase + collapsedHeight;

  for (let i = 0; i < items.length; i++) {
    if (i < hiddenCount) {
      /** Скрытые карты: первые N показываем "ступеньками", дальше накладываем. */
      const hiddenIndex = Math.min(i, Math.max(0, maxHiddenOffsetCards - 1));
      offsetsY[i] = marginTop + hiddenIndex * hiddenOffsetY;
      continue;
    }

    if (i < tailStartIndex) {
      /** Открытая, но нерабочая часть: маленький шаг. */
      const openIndex = i - hiddenCount;
      offsetsY[i] = openBase + openIndex * collapsedOffsetY;
      continue;
    }

    /** Рабочий хвост: нормальный "читаемый" шаг. */
    const tailIndex = i - tailStartIndex;
    offsetsY[i] = tailBase + tailIndex * workTailOffsetY;
  }

  applySpiderTableauLayout(items, inputZone, offsetsY);
};

