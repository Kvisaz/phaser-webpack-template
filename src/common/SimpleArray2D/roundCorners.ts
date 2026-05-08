/** 2-D массив: places[column][row] */
interface IArgs {
  places: (unknown | undefined)[][];
  columns: number;
  rows: number;
  roundX?: number; // «радиус» по X
  roundY?: number; // «радиус» по Y
}

/**
 * Заполняет undefined ячейки, расположенные *за пределами* четвертей эллипса
 * с полуосями roundX × roundY, вырезая углы прямоугольника.
 *
 * Массив изменяется **на месте** и также возвращается (удобно для чейнинга).
 */
export function roundCorners({
  places,
  columns,
  rows,
  roundX = Math.floor(columns / 2),
  roundY = Math.floor(rows / 2),
}: IArgs): (unknown | undefined)[][] {
  // Без чего-либо скруглять нечего
  if (roundX <= 0 || roundY <= 0) return places;

  const isOutsideEllipse = (dx: number, dy: number) =>
    (dx * dx) / (roundX * roundX) + (dy * dy) / (roundY * roundY) > 1;

  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      // координаты относительно каждой из четырёх четвертей
      const left = x;
      const right = columns - 1 - x;
      const top = y;
      const bottom = rows - 1 - y;

      let cut = false;

      // ┌ левый-верхний угол
      if (left < roundX && top < roundY) {
        cut = isOutsideEllipse(roundX - left - 0.5, roundY - top - 0.5);
      }
      // ┐ правый-верхний
      else if (right < roundX && top < roundY) {
        cut = isOutsideEllipse(roundX - right - 0.5, roundY - top - 0.5);
      }
      // └ левый-нижний
      else if (left < roundX && bottom < roundY) {
        cut = isOutsideEllipse(roundX - left - 0.5, roundY - bottom - 0.5);
      }
      // ┘ правый-нижний
      else if (right < roundX && bottom < roundY) {
        cut = isOutsideEllipse(roundX - right - 0.5, roundY - bottom - 0.5);
      }

      if (cut) places[x][y] = undefined;
    }
  }
  return places;
}
