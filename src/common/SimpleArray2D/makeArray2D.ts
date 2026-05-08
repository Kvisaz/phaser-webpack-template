/** сделать пустой двухмерный массив с нулями **/
export function makeArray2D<T>(
  cols: number,
  rows: number,
  cellGenerator: (col: number, row: number) => T
): T[][] {
  const columns: T[][] = Array.from(new Array(cols));
  columns.forEach((_, columnIndex) => {
    const column =  Array.from(new Array(rows));
    column.forEach((row, rowIndex) => {
      column[rowIndex] = cellGenerator(columnIndex, rowIndex);
    });
    columns[columnIndex] = column;
  });
  return columns;
}
