import { addIdFromRecord } from "./addIdFromRecord";

describe("addIdFromRecord", () => {
  it("adds id based on the key for each entry", () => {
    const input = {
      apple: { price: 1 },
      banana: { price: 2, tag: "fresh" },
    };

    const result = addIdFromRecord(input);

    expect(result).toEqual({
      apple: { price: 1, id: "apple" },
      banana: { price: 2, tag: "fresh", id: "banana" },
    });
  });

  it("returns new record and new item objects", () => {
    const input = {
      first: { value: 10 },
      second: { value: 20 },
    };

    const result = addIdFromRecord(input);

    expect(result).not.toBe(input);
    expect(result.first).not.toBe(input.first);
    expect(result.second).not.toBe(input.second);
  });

  it("does not mutate original items when result changes", () => {
    const input = {
      alpha: { value: 1 },
    };

    const result = addIdFromRecord(input);
    result.alpha.value = 999;

    expect(input.alpha.value).toBe(1);
  });

  it("overwrites existing id fields with the record key", () => {
    const input = {
      pack: { id: "legacy", amount: 5 },
    };

    const result = addIdFromRecord(input);

    expect(result.pack.id).toBe("pack");
    expect(input.pack.id).toBe("legacy");
  });

  it("handles empty records", () => {
    const input: Record<string, object> = {};

    const result = addIdFromRecord(input);

    expect(result).toEqual({});
    expect(result).not.toBe(input);
  });

  it("keeps string keys as ids", () => {
    const input = {
      "01": { value: 7 },
      "2": { value: 8 },
    };

    const result = addIdFromRecord(input);

    expect(result["01"].id).toBe("01");
    expect(result["2"].id).toBe("2");
  });
});
