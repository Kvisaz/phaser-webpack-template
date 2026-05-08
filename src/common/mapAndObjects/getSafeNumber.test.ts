import { getSafeNumber } from "./getSafeNumber";

describe("getSafeNumber", () => {
  it("returns numbers as-is when finite", () => {
    expect(getSafeNumber(0)).toBe(0);
    expect(getSafeNumber(12.5)).toBe(12.5);
    expect(getSafeNumber(-3)).toBe(-3);
  });

  it("returns 0 for non-finite numbers", () => {
    expect(getSafeNumber(Number.NaN)).toBe(0);
    expect(getSafeNumber(Number.POSITIVE_INFINITY)).toBe(0);
    expect(getSafeNumber(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it("handles bigint values when supported", () => {
    const BigIntCtor = (globalThis as { BigInt?: (value: string) => unknown }).BigInt;
    if (!BigIntCtor) return;

    const ten = BigIntCtor("10");
    const minusSeven = BigIntCtor("-7");

    expect(getSafeNumber(ten)).toBe(10);
    expect(getSafeNumber(minusSeven)).toBe(-7);
  });

  it("returns 0 for bigint values that overflow to Infinity", () => {
    const BigIntCtor = (globalThis as { BigInt?: (value: string) => unknown }).BigInt;
    if (!BigIntCtor) return;

    const huge = BigIntCtor(`1${"0".repeat(400)}`);
    expect(getSafeNumber(huge)).toBe(0);
  });

  it("parses numeric strings", () => {
    expect(getSafeNumber("42")).toBe(42);
    expect(getSafeNumber("  3.14  ")).toBe(3.14);
    expect(getSafeNumber("1e3")).toBe(1000);
    expect(getSafeNumber("0x10")).toBe(16);
  });

  it("returns 0 for empty or non-numeric strings", () => {
    expect(getSafeNumber("")).toBe(0);
    expect(getSafeNumber("   ")).toBe(0);
    expect(getSafeNumber("nope")).toBe(0);
    expect(getSafeNumber("Infinity")).toBe(0);
  });

  it("coerces boolean values", () => {
    expect(getSafeNumber(true)).toBe(1);
    expect(getSafeNumber(false)).toBe(0);
  });

  it("handles Number objects", () => {
    expect(getSafeNumber(new Number(5))).toBe(5);
    expect(getSafeNumber(new Number(NaN))).toBe(0);
    expect(getSafeNumber(new Number(Infinity))).toBe(0);
  });

  it("returns 0 for unsupported types", () => {
    expect(getSafeNumber(null)).toBe(0);
    expect(getSafeNumber(undefined)).toBe(0);
    expect(getSafeNumber({})).toBe(0);
    expect(getSafeNumber([])).toBe(0);
    expect(getSafeNumber(() => 1)).toBe(0);
  });
});
