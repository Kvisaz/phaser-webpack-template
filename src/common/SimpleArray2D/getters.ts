export function getColumn(x: number, cellSize: number): number {
  return Math.floor(x / cellSize);
}

export function getColumnCenterX(column: number, cellSize: number): number {
  return column * cellSize + cellSize / 2;
}

export function getRow(y: number, cellSize: number): number {
  return Math.floor(y / cellSize);
}

export function getRowCenterY(row: number, cellSize: number): number {
  return row * cellSize + cellSize / 2;
}


export function getColumns(width: number, cellSize: number): number {
  return Math.ceil(width / cellSize);
}

export function getRows(height: number, cellSize: number): number {
  return Math.ceil(height / cellSize);
}
