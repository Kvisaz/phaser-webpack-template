
export function convertMapToIdArray<T extends object>(map: Record<string, T>): Array<T & { id: string }> {
  return Object.entries(map).map(([id, value]) => ({
    ...value,
    id,
  }));
}
