export function map2D<T, U>(
    arr: T[][],
    callback: (value: T, col: number, row: number) => U
): U[][] {
    const columns = arr.length;
    const rows = columns === 0 ? 0 : arr[0].length;
    const result: U[][] = new Array(columns);

    for (let col = 0; col < columns; col++) {
        result[col] = new Array(rows);
        for (let row = 0; row < rows; row++) {
            result[col][row] = callback(arr[col][row], col, row);
        }
    }

    return result;
}
