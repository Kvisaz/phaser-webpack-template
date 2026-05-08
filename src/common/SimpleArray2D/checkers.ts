export const isSafeArr2Place = (column: number, row: number, columns: number, rows: number) => {
  return column >= 0 && row >= 0 && column < columns && row < rows;
};
