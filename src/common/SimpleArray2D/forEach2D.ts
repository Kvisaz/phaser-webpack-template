export function forEach2D<T>(
  arr: T[][],
  callback: (value: T, col: number, row: number) => boolean | void
) {
  const columns = arr.length;
  if (columns <= 0) {
    console.warn('viewPortColumns <= 0');
    return;
  }

  const rows = arr[0].length;
  if (rows <= 0) {
    console.warn('rows <= 0');
    return;
  }

  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      if (callback(arr[col][row], col, row)) return;
    }
  }
}
