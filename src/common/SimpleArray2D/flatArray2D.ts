import { forEach2D } from "./forEach2D";

export enum FlatArray2DMode {
  rowByRow = "rowByRow",
  colByCol = "colByCol",
}

export function flatArray2D<T>(arr: T[][], mode: FlatArray2DMode = FlatArray2DMode.colByCol): T[] {
  const result: T[] = [];
  forEach2D(arr, (value) => {
    result.push(value);
  });
  return result;
}
