import { map2D } from "./map2D";

describe("map2D", () => {
  it("should correctly transform each element of the array", () => {
    const array = [
      [1, 2],
      [3, 4],
    ];
    const result = map2D(array, (value) => value * 2);
    expect(result).toEqual([
      [2, 4],
      [6, 8],
    ]);
  });

  it("should maintain the dimensions of the original array", () => {
    const array = [
      [1, 2],
      [3, 4],
    ];
    const result = map2D(array, (value) => value * 2);
    expect(result.length).toBe(array.length);
    result.forEach((row, index) => {
      expect(row.length).toBe(array[index].length);
    });
  });

  it("should handle an empty array correctly", () => {
    const array: number[][] = [];
    const result = map2D(array, (value) => value * 2);
    expect(result).toEqual([]);
  });

  it("should not modify the original array", () => {
    const array = [
      [1, 2],
      [3, 4],
    ];
    const copy = [...array.map((row) => [...row])]; // Deep copy of the array
    map2D(array, (value) => value * 2);
    expect(array).toEqual(copy);
  });

  it("should correctly handle a 2D array of objects", () => {
    const array = [
      [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
      [
        { x: 5, y: 6 },
        { x: 7, y: 8 },
      ],
    ];
    const result = map2D(array, (obj) => ({ ...obj, x: obj.x * 2 }));
    expect(result).toEqual([
      [
        { x: 2, y: 2 },
        { x: 6, y: 4 },
      ],
      [
        { x: 10, y: 6 },
        { x: 14, y: 8 },
      ],
    ]);
  });
});
