import { Align, AlignObject } from "@kvisaz/phaser-sugar";

interface Positionable {
  setPosition(x: number, y: number): any;
}

interface Boundable {
  getBounds(): Phaser.Geom.Rectangle;
}

interface DirectPositionable {
  x: number;
  y: number;
  originX: number;
  originY: number;
}

interface LayoutAble extends Positionable, Boundable, DirectPositionable {}

export class LayoutUtils {
  /**
   * Layout positionable objects in grid, row by row
   * всегда размещает первый элемент в 0, 0
   * @param objects
   * @param unitInRow
   * @param colStep - step between left edges of objects, in units for setPosition
   * @param rowStep - step between top edges of objects, in units for setPosition
   * @param centerLastRow - align last row if it is`nt full
   * @param left
   * @param top
   */
  static makeGridByRow(
    objects: Positionable[],
    unitInRow: number,
    colStep: number,
    rowStep: number,
    centerLastRow = false,
    left = 0,
    top = 0,
  ) {
    const amount = objects.length;

    const ROWS_AMOUNT = Math.ceil(amount / unitInRow);
    const LAST_ROW = ROWS_AMOUNT - 1;

    // last row is not full ?
    const hasNotFullLastRow = amount % unitInRow > 0;

    const LAST_ROW_OFFSET = hasNotFullLastRow && centerLastRow ? ((unitInRow - (amount % unitInRow)) * colStep) / 2 : 0;

    const align = new Align();
    for (let i = 0; i < amount; i++) {
      const row = Math.floor(i / unitInRow);
      const col = i % unitInRow;

      const isLastRow = row === LAST_ROW;

      const colX = left + col * colStep;
      const x = isLastRow ? colX + LAST_ROW_OFFSET : colX;
      const y = top + row * rowStep;

      align.setPosition(objects[i] as AlignObject, x, y);
    }
  }

  /**
   * Layout positionable objects in grid, col by col
   * @param objects
   * @param unitInColumn
   * @param colStep - step between left edges of objects, in units for setPosition
   * @param rowStep - step between top edges of objects, in units for setPosition
   * @param centerLastRow - align last row if it is`nt full
   */
  static makeGridByColumn(
    objects: Positionable[],
    unitInColumn: number,
    colStep: number,
    rowStep: number,
    centerLastRow = false,
  ) {
    const rowsAmount = unitInColumn;
    const unitInRow = Math.ceil(objects.length / rowsAmount);
    LayoutUtils.makeGridByRow(objects, unitInRow, colStep, rowStep, centerLastRow);
    return {
      columnAmount: unitInRow,
    };
  }

  static getBounds(objects: Boundable[]): Phaser.Geom.Rectangle {
    if (objects.length < 1) {
      return new Phaser.Geom.Rectangle();
    }
    let bounds = objects[0].getBounds();
    for (let i = 1; i < objects.length; i++) {
      bounds = Phaser.Geom.Rectangle.Union(bounds, objects[i].getBounds());
    }
    return bounds;
  }

  static centerIn(inObject: LayoutAble, child: LayoutAble, offsetX = 0, offsetY = 0, modelZoom = 1) {
    const { x: anchorX, y: anchorY, width: anchorWidth, height: anchorHeight } = inObject.getBounds();
    const { width, height } = child.getBounds();

    const x = (anchorX + (anchorWidth - width) / 2) / modelZoom + offsetX;
    const y = (anchorY + (anchorHeight - height) / 2) / modelZoom + offsetY;

    child.setPosition(x, y);
  }

  static centerX(obj: LayoutAble, target: LayoutAble, offset = 0) {
    const { width: oW } = obj.getBounds();
    const { x: tX, width: tW } = target.getBounds();
    obj.x = tX + (tW - oW);
  }

  static centerY(obj: LayoutAble, target: LayoutAble, offset = 0) {
    const { height: oH } = obj.getBounds();
    const { y: tY, height: tH } = target.getBounds();
    obj.y = tY + (tH - oH) / 2 + offset;
  }
}
