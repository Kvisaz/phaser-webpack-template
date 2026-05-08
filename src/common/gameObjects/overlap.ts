import { IBoundable } from "@kvisaz/phaser-sugar";

// overlap/overlap.ts — маленькие утилиты без привязки к сцене

// 1) Базовая математика для прямоугольников
export function rectIntersectionArea(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): number {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const r = Math.min(a.right, b.right);
  const btm = Math.min(a.bottom, b.bottom);
  const w = r - x;
  const h = btm - y;
  return w > 0 && h > 0 ? w * h : 0;
}

// 3) Простейшая площадь пересечения двух GameObject по их bounds
export function overlapAreaByBounds(gameObject: IBoundable, dropZone: IBoundable): number {
  return rectIntersectionArea(gameObject.getBounds(), dropZone.getBounds());
}

// 4) Фабрика с «паддингом» (расширяем/сжимаем зоны перед расчётом)
export function makeOverlapAreaWithPadding(padding: number) {
  return (gameObject: IBoundable, dropZone: IBoundable): number => {
    const a = gameObject.getBounds();
    const b = dropZone.getBounds();
    const ap = new Phaser.Geom.Rectangle(a.x - padding, a.y - padding, a.width + 2 * padding, a.height + 2 * padding);
    const bp = new Phaser.Geom.Rectangle(b.x - padding, b.y - padding, b.width + 2 * padding, b.height + 2 * padding);
    return rectIntersectionArea(ap, bp);
  };
}


export type DragDropChecker<Zone extends IBoundable = IBoundable> = (drag: IBoundable, drop: Zone) => boolean;

export interface OverlapAreaConfig {
  isDroppable: DragDropChecker;
  getOverlapArea?: (drag: IBoundable, drop: IBoundable) => number;
  dropZoneSelection?: "first" | "maxOverlap";
  minOverlapArea?: number;
}

export function findFirstOverlap(
  gameObject: IBoundable,
  zones: IBoundable[],
  config: OverlapAreaConfig,
): IBoundable | null {
  const overlapArea = config.getOverlapArea ?? overlapAreaByBounds;
  for (let i = 0; i < zones.length; i++) {
    const dz = zones[i];
    if (!config.isDroppable(gameObject, dz)) continue;
    if (overlapArea(gameObject, dz) > 0) {
      return dz;
    }
  }
  return null;
}

export function findMaxOverlap(gameObject: IBoundable, zones: IBoundable[], config: OverlapAreaConfig): IBoundable | null {
  let best: IBoundable | null = null;
  let bestArea = config.minOverlapArea ?? 0;

  const overlapArea = config.getOverlapArea ?? overlapAreaByBounds;

  for (let i = 0; i < zones.length; i++) {
    const dz = zones[i];
    if (!config.isDroppable(gameObject, dz)) continue;

    const area = overlapArea(gameObject, dz);
    if (area >= bestArea) {
      bestArea = area;
      best = dz;
    }
  }
  return best;
}

/** вернуть дропзону которая позволяет **/
export function findSimpleMaxOverlap<Zone extends IBoundable = IBoundable>(
  gameObject: IBoundable,
  zones: Zone[],
  isDroppable: DragDropChecker<Zone>,
  minOverlapArea = 0,
): Zone | null {
  let best: Zone | null = null;
  let bestArea = minOverlapArea;

  const overlapArea = overlapAreaByBounds;

  for (let i = 0; i < zones.length; i++) {
    const dz = zones[i];
    if (!isDroppable(gameObject, dz)) continue;

    const area = overlapArea(gameObject, dz);
    if (area <= 0) continue;
    if (area > bestArea) {
      bestArea = area;
      best = dz;
    }
  }
  return best;
}

export function findFirstDroppableOverlap(
  gameObject: IBoundable,
  zones: IBoundable[],
  config: OverlapAreaConfig,
): IBoundable | null {
  return config.dropZoneSelection === "first"
    ? findFirstOverlap(gameObject, zones, config)
    : findMaxOverlap(gameObject, zones, config);
}
