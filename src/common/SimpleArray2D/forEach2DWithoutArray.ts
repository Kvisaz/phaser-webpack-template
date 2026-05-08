/** перебрать ячейки в виртуальном массиве размером viewPortColumns, row
 *  использовать когда содержимое ячеек не имеют значения
 *
 *  если callback возвращает true - останавливает перебор
 * **/
export function forEach2DWithoutArray(
  columns: number,
  rows: number,
  callback: (col: number, row: number) => boolean | void
) {
  if (columns <= 0) {
    console.warn('viewPortColumns <= 0');
    return;
  }
  if (rows <= 0) {
    console.warn('rows <= 0');
    return;
  }
  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      if (callback(col, row)) return;
    }
  }
}
