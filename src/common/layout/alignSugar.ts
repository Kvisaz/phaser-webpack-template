import {Align, AlignMethod, AlignObject, arrayAlign, layoutChain, makeAlign} from '@kvisaz/phaser-sugar';
import {flatArray2D} from '../SimpleArray2D';

/**
 * Пакет коротких хелперов которые всегда возвращают объект
 * которым можно опереировать в следующих операциях выравнивнаия
 ***/

export function centerX(anchor: AlignObject, target: AlignObject) {
    makeAlign(align => align.anchor(anchor).centerX(target));
    return target;
}

export function center(anchor: AlignObject, target: AlignObject) {
    makeAlign(align => align.anchor(anchor).center(target));
    return target;
}

export interface ISugarRowOptions {
    /** anchor for layout, if not defined - children[0] **/
    anchor?: AlignObject;
    alignToAnchor?: AlignMethod;
    nextOffsetX?: number | ((i: number) => number);
}

/** Ряд - по умолчанию центрирует по Y **/
export function row(children: AlignObject[], options: ISugarRowOptions = {}) {
    return layoutChain({
        children,
        alignToNext: AlignMethod.RIGHT_TO,
        anchor: options.anchor,
        alignToAnchor: options.alignToAnchor ?? AlignMethod.CENTER_Y,
        nextOffsetX: options.nextOffsetX ?? 0,
    })
}

export interface ISugarColumnOptions {
    /** anchor for layout, if not defined - children[0] **/
    anchor?: AlignObject;
    alignToAnchor?: AlignMethod;
    nextOffsetY?: number | ((i: number) => number);
}

/** Колонка - по умолчанию центрирует по X **/
export function column(children: AlignObject[], options: ISugarColumnOptions = {}) {
    return layoutChain({
        children,
        alignToNext: AlignMethod.BOTTOM_TO,
        anchor: options.anchor,
        alignToAnchor: options.alignToAnchor ?? AlignMethod.CENTER_X,
        nextOffsetY: options.nextOffsetY ?? 0,
    })
}

export interface ISugarGridOptions {
    /** как работает обращение children2D[][] **/
    type?: "xy" | "yx";
    anchor?: AlignObject;
    cellAutoDetect?: boolean;
    cellWidth?: number;
    cellHeight?: number;
}

/** Сетка из двумерного массива, жесткая ячейка **/
export function grid(children2D: AlignObject[][], options: ISugarGridOptions = {}) {
    const children = flatArray2D(children2D);
    const firstChild = children[0];

    if (!firstChild) {
        return arrayAlign.alignObject(children);
    }

    const anchor = options.anchor ?? firstChild;
    const anchorBounds = anchor.getBounds();
    const cellSize = getGridCellSize(children, options);
    const isXY = options.type === "xy";

    /** Двумерный массив может быть задан как [x][y] или [y][x], поэтому индексы ячейки считаются отдельно от индексов обхода. **/
    children2D.forEach((line, lineIndex) => {
        line.forEach((child, childIndex) => {
            const cellX = isXY ? lineIndex : childIndex;
            const cellY = isXY ? childIndex : lineIndex;
            Align.setLeftTop(
                child,
                anchorBounds.left + cellX * cellSize.width,
                anchorBounds.top + cellY * cellSize.height
            );
        });
    });

    return arrayAlign.alignObject(children);
}

interface IGridCellSize {
    width: number;
    height: number;
}

/** Возвращает размер ячейки сетки из явных опций или максимального размера объектов. **/
function getGridCellSize(children: AlignObject[], options: ISugarGridOptions): IGridCellSize {
    const firstBounds = children[0].getBounds();

    if (options.cellAutoDetect === false) {
        return {
            width: options.cellWidth ?? firstBounds.width,
            height: options.cellHeight ?? firstBounds.height,
        };
    }

    const autoSize = children.reduce<IGridCellSize>((size, child) => {
        const bounds = child.getBounds();
        return {
            width: Math.max(size.width, bounds.width),
            height: Math.max(size.height, bounds.height),
        };
    }, {width: 0, height: 0});

    return {
        width: options.cellWidth ?? autoSize.width,
        height: options.cellHeight ?? autoSize.height,
    };
}
