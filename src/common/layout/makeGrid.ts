import { Align, AlignObject } from "@kvisaz/phaser-sugar";

interface Positionable {
  setPosition(x: number, y: number): any;
}

interface IProps {
  objects: Positionable[];
  unitInRow: number;
  colStep: number;
  rowStep: number;
  centerLastRow?: boolean;
  left?: number;
  top?: number;
  snake?: boolean;
  evenRowOffsetX?: number;
}

/**
 * Расставляет объекты сеткой слева‑направо построчно.
 * Если snake = true - каждая нечётная (с нулевой нумерацией) строка
 * идёт справа‑налево («змейкой»).
 */
export function makeGrid({
  objects,
  unitInRow,
  colStep,
  rowStep,
  centerLastRow = false,
  left = 0,
  top = 0,
  snake = false,
  evenRowOffsetX = 0,
}: IProps) {
  const amount = objects.length;
  if (amount === 0) return;

  const align = new Align();

  const rowsAmount = Math.ceil(amount / unitInRow);
  const lastRowIndex = rowsAmount - 1;
  const hasNotFullLastRow = amount % unitInRow !== 0;

  for (let i = 0; i < amount; i++) {
    const row = Math.floor(i / unitInRow);
    const indexInRow = i % unitInRow;

    // сколько объектов именно в этой строке
    const unitsInThisRow = row === lastRowIndex && hasNotFullLastRow ? amount % unitInRow : unitInRow;

    const isLastCenterAlign = row === lastRowIndex && centerLastRow;

    const evenOffsetX = row % 2 ? evenRowOffsetX : 0;

    // если центрируем неполную последнюю строку — вычисляем смещение
    const rowOffset = isLastCenterAlign
      ? evenOffsetX > 0
        ? 0
        : ((unitInRow - unitsInThisRow) * colStep) / 2
      : evenOffsetX;

    // выбираем «реальный» столбец с учётом змейки
    const col = snake && row % 2 === 1 ? unitsInThisRow - 1 - indexInRow : indexInRow;

    const x = left + rowOffset + col * colStep;
    const y = top + row * rowStep;

    align.setPosition(objects[i] as AlignObject, x, y);
  }
}
