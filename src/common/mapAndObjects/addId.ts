export function addId<T extends object>(obj: T, id: string): T & { id: string } {
  return {
    ...obj,
    id,
  };
}

