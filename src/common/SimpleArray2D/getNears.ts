interface ColumnRow {
  column: number;
  row: number;
}

/**
 * взять соседей у клетки в двухмерном массиве
 * grid cell format = cell[col][row]
 *
 * доступ к ячейкам по правилам arr:T[колонка][ряд]
 **/
export function getNears<T>(arr: T[][], column: number, row: number, cellRadius: number = 1): T[] {
  if (arr.length === 0 || arr[0].length === 0) return [];
  const nears: T[] = [];
  const firstRow = 0;
  const firstColumn = 0;
  const lastColumn = arr.length - 1;
  const lastRow = arr[0].length - 1;

  // Проверка клеток вокруг заданной клетки в радиусе cellRadius
  for (let nextColumn = column - cellRadius; nextColumn <= column + cellRadius; nextColumn++) {
    for (let nextRow = row - cellRadius; nextRow <= row + cellRadius; nextRow++) {
      // Проверяем, что текущие индексы не выходят за границы массива и не равны индексу исходной клетки
      if (
        nextRow >= firstRow &&
        nextRow <= lastRow && // строка находится в пределах массива
        nextColumn >= firstColumn &&
        nextColumn <= lastColumn && // колонка находится в пределах массива
        !(nextRow === row && nextColumn === column) // не добавляем саму исходную клетку
      ) {
        nears.push(arr[nextColumn][nextRow]);
      }
    }
  }

  return nears;
}

/** взять координаты окружающих соседей без проверки **/
export function getNearsColumnRows(column: number, row: number, cellRadius: number = 1): ColumnRow[] {
  const nears: ColumnRow[] = [];

  // Проверка клеток вокруг заданной клетки в радиусе cellRadius
  for (let nextColumn = column - cellRadius; nextColumn <= column + cellRadius; nextColumn++) {
    for (let nextRow = row - cellRadius; nextRow <= row + cellRadius; nextRow++) {
      if (
        !(nextRow === row && nextColumn === column) // не добавляем саму исходную клетку
      ) {
        nears.push({ column: nextColumn, row: nextRow });
      }
    }
  }

  return nears;
}

/** взять координаты 4х окружающих соседей
 * - без проверки
 * - только по горизонтали или вертикали
 * - радиус 1
 * **/
export function getFourNearsColumnRows(column: number, row: number): ColumnRow[] {
  return [
    { column: column - 1, row },
    { column: column + 1, row },
    { column: column, row: row - 1 },
    { column: column, row: row + 1 },
  ];
}

/** взять координаты 8х окружающих соседей
 * - без проверки
 * - по горизонтали, вертикали и диагонали
 * - радиус 1
 * **/
export function getEightNearsColumnRows(column: number, row: number): ColumnRow[] {
  return [
    // top line
    { column: column - 1, row: row - 1 },
    { column: column, row: row - 1 },
    { column: column + 1, row: row - 1 },
    // middle line
    { column: column - 1, row },
    { column: column + 1, row },
    // bottom line
    { column: column - 1, row: row + 1 },
    { column: column, row: row + 1 },
    { column: column + 1, row: row + 1 },
  ];
}
