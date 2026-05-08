import { formatString } from "./index";

describe("formatString", () => {
  it("should replace placeholders with values", () => {
    const template = "some {{1}} words {{2}}";
    const values = ["big", 42];

    expect(formatString(template, values)).toBe("some big words 42");
  });

  it("should keep placeholder if no value provided", () => {
    const template = "hello {{1}}";
    const values: string[] = [];

    expect(formatString(template, values)).toBe("hello {{1}}");
  });

  it("should replace multiple placeholders", () => {
    const template = "some {{1}} words {{2}} here {{3}}";
    const values = ["big", 42, "placeholder"];

    expect(formatString(template, values)).toBe("some big words 42 here placeholder");
  });

  // ... прежние тесты

  it("should replace placeholders in arbitrary order", () => {
    const template = "This {{2}} a {{1}} with arbitrary {{3}} order";
    const values = ["test", "is", "placeholder"];

    expect(formatString(template, values)).toBe("This is a test with arbitrary placeholder order");
  });
});
