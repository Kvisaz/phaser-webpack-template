/** просто смещает карты вниз, если их меньше чем лимит смещенных карт **/
export function getOffsetYFromTop(i: number, cardOffset = 6, offsetCardAmounts = 3): number {
  const lastOffsetIndex = offsetCardAmounts - 1;

  const delta = i <= lastOffsetIndex ? lastOffsetIndex - i : lastOffsetIndex;

  return i <= lastOffsetIndex ? i * cardOffset : lastOffsetIndex * cardOffset;
}

/** смещает вниз и вверх, годится для центрирования по зоне **/
export function getOffsetYcentering(i: number, cardOffset = 6, offsetCardAmounts = 3): number {
  const lastOffsetIndex = offsetCardAmounts - 1;

  const midOffsetIndex = offsetCardAmounts / 2;
  const delta = i <= lastOffsetIndex ? i - midOffsetIndex : lastOffsetIndex - midOffsetIndex;

  return delta * cardOffset;
}

/** размещает карты без лимита со смещением - годится если нужно показать их значения **/
export function getUnlimitedOffsetY(i: number, cardOffset = 6): number {
  return i * cardOffset;
}
