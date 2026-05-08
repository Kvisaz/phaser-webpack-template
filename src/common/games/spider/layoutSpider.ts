import {Align, AlignObject, arrayAlign, layoutRow} from "@kvisaz/phaser-sugar";

export interface ILayoutSpiderProps {
    stock: AlignObject;
    foundations: AlignObject[];
    tableaus: AlignObject[];
}

/** Функция леайута возвращает объект, который можно дальше передвигать и выравнивать **/
export type SpiderLayoutFunc = (props: ILayoutSpiderProps) => AlignObject;

const cardGap = 12;
const topToTableauGap = 48;

export function basicLayoutSpider({stock, foundations, tableaus}: ILayoutSpiderProps): AlignObject {


    const baseRow = layoutRow({
        children: foundations,
        nextOffsetX: cardGap,
    });

    const tableausRow = layoutRow({
        children: tableaus,
        nextOffsetX: cardGap,
    });

    const align = new Align();
    // верхний левый угол - колода
    align.anchor(stock);
    // стол под колодой
    align.leftIn(tableausRow).bottomTo(tableausRow, topToTableauGap);

    // база - на одном уровне с колодой, по правому краю стола
    align.anchor(stock).topIn(baseRow);
    align.anchor(tableausRow).rightIn(baseRow);

    return arrayAlign.alignObject([stock, ...foundations, ...tableaus]);
}

