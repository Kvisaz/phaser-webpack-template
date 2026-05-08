export const getCycled = <T>(arr: T[], index: number): T => {
  const safeIndex = index % arr.length;
  return arr[safeIndex];
}
