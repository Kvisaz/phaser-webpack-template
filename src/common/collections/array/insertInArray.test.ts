import { insertInArray } from "./insertInArray";

describe("insertInArray", () => {
  it("inserts items into the middle and keeps the original reference", () => {
    const arr = [1, 2, 3, 4];
    const result = insertInArray(arr, [9, 8], 2);

    expect(result).toBe(arr);
    expect(arr).toEqual([1, 2, 9, 8, 3, 4]);
  });

  it("inserts a single item without wrapping into array", () => {
    const arr = [1, 3, 4];
    const result = insertInArray(arr, 2, 1);

    expect(result).toBe(arr);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  it("appends items when index is missing or exceeds length", () => {
    const arr = [1];
    insertInArray(arr, [2, 3]);
    expect(arr).toEqual([1, 2, 3]);

    const arr2 = [1];
    insertInArray(arr2, [2], 10);
    expect(arr2).toEqual([1, 2]);

    const arr3 = [1];
    insertInArray(arr3, [2], Number.NaN);
    expect(arr3).toEqual([1, 2]);
  });

  it("inserts at the start when index is negative", () => {
    const arr = [3, 4];
    insertInArray(arr, [1, 2], -5);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  it("does nothing when items are empty", () => {
    const arr = [1, 2];
    const result = insertInArray(arr, [], 1);

    expect(result).toBe(arr);
    expect(arr).toEqual([1, 2]);
  });
});
