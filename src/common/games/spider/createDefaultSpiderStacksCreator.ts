import { AlignObject, IBoundable } from "@kvisaz/phaser-sugar";
import {
  adaptiveHiddenVisibleCardLayoutStrategy,
  centeredCardLayoutStrategy,
  limitedHiddenCardLayoutStrategy,
} from "../cards-layout";
import { ICardPlace, ILayoutStrategy } from "../cards-abstract";
import { SpiderStack, SpiderStackMap } from "./cards";
import { SpiderStackType, SpiderStacksCreator } from "./types";
import {
  spiderTableauLimitNonTailCardsLayoutStrategy,
  spiderTableauMiniOffsetForNonTailLayoutStrategy,
} from "./spiderLayoutStrategies";
import { SpiderTableauLayoutMode } from "./spiderLayoutStrategies";

interface IProps {
  createCardPlace: () => ICardPlace;
  stockLayoutStrategy?: ILayoutStrategy;
  tableauLayout?: SpiderTableauLayoutMode;
  tableauBottomBoundaryY?: number;
}

const TABLEAUS_AMOUNT = 10;
const FOUNDATIONS_AMOUNT = 8;
const klondikeTableauLayoutOptions = {
  visibleOffsetY: 32,
  firstVisibleOffsetY: 8,
  hiddenOffsetY: 8,
  maxHiddenOffsetCards: 4,
  marginTop: 8,
} as const;

function createTableauLayoutStrategy(
  layoutMode?: SpiderTableauLayoutMode,
  tableauBottomBoundaryY?: number,
) {
  const mode = layoutMode ?? "mini";


  if (mode === "limit") {
    return (cards: AlignObject[], inputZone: IBoundable) =>
      spiderTableauLimitNonTailCardsLayoutStrategy(cards, inputZone, {
        marginTop: 8,
        hiddenOffsetY: 8,
        maxHiddenOffsetCards: 4,
        firstVisibleOffsetY: 8,
        collapsedOffsetY: 4,
        maxCollapsedOffsetCards: 8,
        workTailOffsetY: 32,
      });
  }

  if (mode === "klondike") {
    if (tableauBottomBoundaryY != null) {
      return (cards: AlignObject[], inputZone: IBoundable) =>
        adaptiveHiddenVisibleCardLayoutStrategy(cards, inputZone, {
          ...klondikeTableauLayoutOptions,
          bottomBoundaryY: tableauBottomBoundaryY,
        });
    }

    return (cards: AlignObject[], inputZone: IBoundable) =>
      limitedHiddenCardLayoutStrategy(cards, inputZone, {
        ...klondikeTableauLayoutOptions,
      });
  }

  // mode = mini - default
  return (cards: AlignObject[], inputZone: IBoundable) =>
    spiderTableauMiniOffsetForNonTailLayoutStrategy(cards, inputZone, {
      marginTop: 8,
      hiddenOffsetY: 8,
      maxHiddenOffsetCards: 4,
      firstVisibleOffsetY: 8,
      collapsedOffsetY: 4,
      workTailOffsetY: 32,
    });
}

export function createDefaultSpiderStacksCreator({
  createCardPlace,
  stockLayoutStrategy,
  tableauLayout,
  tableauBottomBoundaryY,
}: IProps): SpiderStacksCreator {
  return () => {
    const tableauLayoutStrategy = createTableauLayoutStrategy(
      tableauLayout,
      tableauBottomBoundaryY,
    );

    const stock = new SpiderStack({
      id: SpiderStackType.STOCK,
      type: SpiderStackType.STOCK,
      cardPlace: createCardPlace(),
      layoutStrategy: stockLayoutStrategy ?? centeredCardLayoutStrategy,
    });

    const foundations = Array.from(new Array(FOUNDATIONS_AMOUNT)).map(
      (_, index) =>
        new SpiderStack({
          id: `${SpiderStackType.FOUNDATION}-${index}`,
          type: SpiderStackType.FOUNDATION,
          cardPlace: createCardPlace(),
          layoutStrategy: centeredCardLayoutStrategy,
        }),
    );

    const tableaus = Array.from(new Array(TABLEAUS_AMOUNT)).map(
      (_, index) =>
        new SpiderStack({
          id: `${SpiderStackType.TABLEAU}-${index}`,
          type: SpiderStackType.TABLEAU,
          cardPlace: createCardPlace(),
          layoutStrategy: tableauLayoutStrategy,
        }),
    );

    return new SpiderStackMap([stock, ...foundations, ...tableaus]);
  };
}
