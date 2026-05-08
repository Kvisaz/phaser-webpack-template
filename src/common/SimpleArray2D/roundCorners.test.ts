/**
 * roundCorners.test.ts
 *
 * Тесты для функции `roundCorners` на ts-jest.
 * Файл располагается в той же папке, что и roundCorners.ts.
 */
import { roundCorners } from "./roundCorners";

const FILLED = 1;

/** хелпер создаёт двумерный массив places[column][row] */
function makeGrid(columns: number, rows: number, value = FILLED) {
  return Array.from({ length: columns }, () => Array(rows).fill(value));
}

describe("roundCorners", () => {
  it("возвращает тот же самый объект (in-place)", () => {
    const places = makeGrid(2, 2);
    const result = roundCorners({ places, columns: 2, rows: 2, roundX: 0, roundY: 0 });
    expect(result).toBe(places);
  });

  it("ничего не изменяет, если roundX или roundY ≤ 0", () => {
    const places = makeGrid(3, 3);
    roundCorners({ places, columns: 3, rows: 3, roundX: -1, roundY: 0 });
    expect(places.flat().every((cell) => cell === FILLED)).toBe(true);
  });

  it("скругляет 4×4 карту с радиусом по умолчанию (2×2)", () => {
    const places = makeGrid(4, 4);
    roundCorners({ places, columns: 4, rows: 4 }); // roundX = 2, roundY = 2

    // угловые клетки должны быть undefined
    [
      [0, 0],
      [3, 0],
      [0, 3],
      [3, 3],
    ].forEach(([c, r]) => {
      expect(places[c][r]).toBeUndefined();
    });

    // центральная область не тронута
    expect(places[1][1]).toBe(FILLED);
    expect(places[2][2]).toBe(FILLED);
  });

  it("корректно скругляет прямоугольник 6×4 с радиусами 3×2", () => {
    const places = makeGrid(6, 4);
    roundCorners({ places, columns: 6, rows: 4, roundX: 3, roundY: 2 });

    // экстремальные углы должны быть пустыми
    [
      [0, 0],
      [5, 0],
      [0, 3],
      [5, 3],
    ].forEach(([c, r]) => {
      expect(places[c][r]).toBeUndefined();
    });

    // внутренняя клетка остаётся заполненной
    expect(places[2][1]).toBe(FILLED);
  });
});
