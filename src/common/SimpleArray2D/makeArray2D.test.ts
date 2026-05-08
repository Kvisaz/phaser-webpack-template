import { makeArray2D } from "./makeArray2D";

describe("makeArray2D", () => {
  it("should createGO an empty array for 0 cols and rows", () => {
    const result = makeArray2D(0, 0, () => 0);
    expect(result).toEqual([]);
  });

  it("should createGO an array of correct dimensions", () => {
    const cols = 3;
    const rows = 2;
    const result = makeArray2D(cols, rows, () => 0);
    expect(result.length).toBe(cols);
    result.forEach((column) => expect(column.length).toBe(rows));
  });

  it("should fill the array correctly using the cellGenerator function", () => {
    const cols = 2;
    const rows = 2;
    const cellGenerator = (col: number, row: number) => col + row;
    const expected = [
      [0, 1],
      [1, 2],
    ];
    const result = makeArray2D(cols, rows, cellGenerator);
    expect(result).toEqual(expected);
  });
});
