export function addIdFromRecord<T extends Record<string, object>>(
  record: T,
): {
  [K in keyof T]: T[K] & { id: K };
} {
  const result = {} as {
    [K in keyof T]: T[K] & { id: K };
  };

  for (const key in record) {
    result[key] = {
      ...record[key],
      id: key,
    };
  }

  return result;
}
