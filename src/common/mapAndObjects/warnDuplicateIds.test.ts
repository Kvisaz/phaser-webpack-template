import { warnDuplicateIds } from "./warnDuplicateIds";

describe("warnDuplicateIds", () => {
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  afterEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it("does not warn when all ids are unique", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

    warnDuplicateIds(items);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns with default label when duplicates exist", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "a" }, { id: "b" }];

    warnDuplicateIds(items);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("[items] Duplicate ids:", ["a", "b"]);
  });

  it("uses custom label", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "a" },
    ];

    warnDuplicateIds(items, {
      label: "custom",
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("[custom] Duplicate ids:", ["a"]);
  });
});
