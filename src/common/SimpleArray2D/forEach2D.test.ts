import { forEach2D } from "./forEach2D";

describe("forEach2D", () => {
  it("should call the callback function the correct number of times", () => {
    const mockArray = [
      [1, 2],
      [3, 4],
    ];
    const mockCallback = jest.fn();
    forEach2D(mockArray, mockCallback);
    expect(mockCallback.mock.calls.length).toBe(4);
  });

  it("should pass the correct arguments to the callback function", () => {
    const mockArray = [
      [1, 2],
      [3, 4],
    ];
    const mockCallback = jest.fn();
    forEach2D(mockArray, mockCallback);
    expect(mockCallback.mock.calls[0]).toEqual([1, 0, 0]);
    expect(mockCallback.mock.calls[1]).toEqual([2, 0, 1]);
    expect(mockCallback.mock.calls[2]).toEqual([3, 1, 0]);
    expect(mockCallback.mock.calls[3]).toEqual([4, 1, 1]);
  });

  it("should handle an empty array correctly", () => {
    const mockArray: number[][] = [];
    const mockCallback = jest.fn();
    forEach2D(mockArray, mockCallback);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should stop iterating if the callback returns true", () => {
    const mockArray = [
      [1, 2],
      [3, 4],
    ];
    const mockCallback = jest.fn().mockReturnValueOnce(true);
    forEach2D(mockArray, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should handle a uniform array correctly", () => {
    const mockArray = [
      [1, 1],
      [1, 1],
    ];
    const mockCallback = jest.fn();
    forEach2D(mockArray, mockCallback);
    expect(mockCallback.mock.calls.length).toBe(4);
    expect(mockCallback.mock.calls[0]).toEqual([1, 0, 0]);
    expect(mockCallback.mock.calls[1]).toEqual([1, 0, 1]);
    expect(mockCallback.mock.calls[2]).toEqual([1, 1, 0]);
    expect(mockCallback.mock.calls[3]).toEqual([1, 1, 1]);
  });
});
