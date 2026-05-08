export function hasInSet<T>(
  set: Set<T>,
  check: (next: T) => boolean,
): boolean {
  for (const value of set) {
    if (check(value)) {
      return true;
    }
  }
  return false;
}
