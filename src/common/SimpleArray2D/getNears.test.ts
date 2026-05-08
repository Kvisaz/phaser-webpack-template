import { getNears } from "./getNears"; // Импортируем функцию getNears, предполагается, что она находится в файле getNears.ts

describe("getNears function", () => {
  const testArray = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  test("returns correct neighbors in default radius", () => {
    expect(getNears(testArray, 1, 1)).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
    expect(getNears(testArray, 0, 0)).toEqual([2, 4, 5]);
    expect(getNears(testArray, 2, 2)).toEqual([5, 6, 8]);
  });

  test("returns correct neighbors with larger radius", () => {
    expect(getNears(testArray, 1, 1, 2)).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
  });

  test("handles edge cases without throwing", () => {
    expect(getNears(testArray, 0, 0, 2)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(getNears(testArray, 2, 2, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("beyond limits", () => {
    expect(getNears(testArray, -1, -1, 1)).toEqual([1]);
    expect(getNears(testArray, 1, -1, 1)).toEqual([1, 2, 3]);
    expect(getNears(testArray, 1, -1, 2)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getNears(testArray, 3, 3, 1)).toEqual([9]);
    expect(getNears(testArray, 3, 3, 2)).toEqual([5, 6, 8, 9]);
  });
});
