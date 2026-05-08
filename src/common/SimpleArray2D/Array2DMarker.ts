/** пометки по массиву **/
export interface IArray2DMarker {
  /** Очистить все метки */
  clear(): void;
  /**
   * Пометить ячейку, возвращает true если ячейка не была помечена ранее, иначе false.
   * @param column - Номер столбца.
   * @param row - Номер строки.
   **/
  add(column: number, row: number): boolean;
  /**
   * Проверить, помечена ли ячейка.
   * @param column - Номер столбца.
   * @param row - Номер строки.
   **/
  has(column: number, row: number): boolean;

  /**
   * Удалить метку с ячейки.
   * @param column - Номер столбца.
   * @param row - Номер строки.
   * @return true если была метка иначе false
   **/
  delete(column: number, row: number): boolean
}

interface IArray2DCheckerProps {
  columns: number;
  rows: number;
  isValidError?: boolean;
}

const errorMessages = {
  invalidIndex: "Invalid column or row index.",
};

/**
 * Оптимизированный проверщик использованных ячеек в двухмерном массиве.
 * - Использует Set для хранения индексов.
 * - Использует только числа для индексов.
 **/
export class Array2DMarker implements IArray2DMarker{
  private set = new Set<number>();

  constructor(private props: IArray2DCheckerProps) {
    if (props.columns <= 0 || props.rows <= 0) {
      throw new Error("Both viewPortColumns and rows must be positive numbers.");
    }
  }

  /** Очистить все метки */
  clear(): void {
    this.set.clear();
  }

  /**
   * Пометить ячейку, возвращает true если ячейка не была помечена ранее, иначе false.
   * @param column - Номер столбца.
   * @param row - Номер строки.
   **/
  add(column: number, row: number): boolean {
    if (!this.isValidIndexHandle(column, row)) return false;

    const index = this.getArrayIndex(column, row);
    if (this.set.has(index)) return false;
    this.set.add(index);
    return true;
  }

  /**
   * Проверить, помечена ли ячейка.
   * @param column - Номер столбца.
   * @param row - Номер строки.
   **/
  has(column: number, row: number): boolean {
    if (!this.isValidIndexHandle(column, row)) return false;

    return this.set.has(this.getArrayIndex(column, row));
  }

  /**
   * Удалить метку с ячейки.
   * @param column - Номер столбца.
   * @param row - Номер строки.
   * @return true если была метка иначе false
   **/
  delete(column: number, row: number): boolean {
    if (!this.isValidIndexHandle(column, row)) return false;

    return this.set.delete(this.getArrayIndex(column, row));
  }

  /** Проверка допустимости индекса */
  private isValidIndex(col: number, row: number): boolean {
    return col >= 0 && col < this.props.columns && row >= 0 && row < this.props.rows;
  }

  private isValidIndexHandle(col: number, row: number): boolean {
    const isValid = this.isValidIndex(col, row);
    if (isValid) return true;

    if (this.props.isValidError) throw new Error(errorMessages.invalidIndex);
    else {
      console.warn(errorMessages.invalidIndex);
      return false;
    }
  }

  /** Преобразование координат в индекс массива */
  private getArrayIndex(col: number, row: number): number {
    return row * this.props.columns + col;
  }
}
