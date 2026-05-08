export function getSafeNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return 0;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value instanceof Number) {
    const unboxed = value.valueOf();
    return Number.isFinite(unboxed) ? unboxed : 0;
  }

  return 0;
}
