type HasStringId = { id: string };

export function warnDuplicateIds<T extends HasStringId>(
  items: readonly T[],
  options?: {
    label?: string;
  },
): void {
  const label = options?.label ?? "items";
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    const id = item.id;
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }

  if (duplicates.size > 0) {
    console.warn(
      `[${label}] Duplicate ids:`,
      Array.from(duplicates),
    );
  }
}
