export function makeRandomAmount({ lootK, probability, disperse }: {
  lootK: number; probability: number; disperse: number;
}): number {
  return Math.random() < probability
    ? Math.ceil(lootK + Math.floor(Math.random() * (disperse + 1)))
    : 0;
}
