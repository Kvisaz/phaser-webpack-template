import { Array2DMarker } from "./Array2DMarker";

describe("Array2DMarker", () => {
  let marker: Array2DMarker;

  beforeEach(() => {
    marker = new Array2DMarker({ columns: 5, rows: 5, isValidError: true });
  });

  test("should throw error if viewPortColumns or rows are not positive", () => {
    expect(() => new Array2DMarker({ columns: 0, rows: 5 })).toThrow(
      "Both viewPortColumns and rows must be positive numbers.",
    );
    expect(() => new Array2DMarker({ columns: 5, rows: 0 })).toThrow(
      "Both viewPortColumns and rows must be positive numbers.",
    );
  });

  test("should mark and check cells correctly", () => {
    expect(marker.add(1, 1)).toBe(true); // Should mark the cell
    expect(marker.add(1, 1)).toBe(false); // Should return false as it is already marked
    expect(marker.has(1, 1)).toBe(true); // Should return true as it is marked
    expect(marker.has(2, 2)).toBe(false); // Should return false as it is not marked
  });

  test("should delete marked cells correctly", () => {
    marker.add(1, 1);
    expect(marker.delete(1, 1)).toBe(true); // Should delete the cell
    expect(marker.delete(1, 1)).toBe(false); // Should return false as it is already deleted
    expect(marker.has(1, 1)).toBe(false); // Should return false as it is deleted
  });

  test("should clear all marks", () => {
    marker.add(1, 1);
    marker.add(2, 2);
    marker.clear();
    expect(marker.has(1, 1)).toBe(false);
    expect(marker.has(2, 2)).toBe(false);
  });

  test("should handle invalid indexes without throwing error by default", () => {
    marker = new Array2DMarker({ columns: 5, rows: 5, isValidError: false });
    console.warn = jest.fn();
    expect(marker.add(-1, 1)).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("Invalid column or row index.");
    expect(marker.has(-1, 1)).toBe(false);
    expect(marker.delete(-1, 1)).toBe(false);
  });

  test("should throw error on invalid indexes if isValidError is true", () => {
    marker = new Array2DMarker({ columns: 5, rows: 5, isValidError: true });
    expect(() => marker.add(-1, 1)).toThrow("Invalid column or row index.");
    expect(() => marker.has(-1, 1)).toThrow("Invalid column or row index.");
    expect(() => marker.delete(-1, 1)).toThrow("Invalid column or row index.");
  });
});
