import { AlignObject, IBoundable } from "@kvisaz/phaser-sugar";
import {
  centeredCardLayoutStrategy,
  klondikeGraveLayoutStrategy,
  showValueCardFromTopLayoutStrategy,
} from "../cards-layout";
import { ICardPlace } from "../cards-abstract";
import { KlondikeStack, KlondikeStackMap } from "./cards";
import { KlondikeStacksCreator, KlondikeStackType } from "./types";
import { layoutDefaultKlondike } from "./layoutDefaultKlondike";

interface IProps {
  scene: Phaser.Scene;
  createCardPlace: () => ICardPlace;
}

const BASES_AMOUNT = 4;
const PILES_AMOUNT = 7;

const cardLayout = {
  deck: centeredCardLayoutStrategy,
  grave: klondikeGraveLayoutStrategy,
  base: centeredCardLayoutStrategy,
  pile: (cards: AlignObject[], inputZone: IBoundable) =>
    showValueCardFromTopLayoutStrategy(cards, inputZone, { offsetY: 32 }),
} as const;

export function createDefaultKlondikeStacksCreator({
  scene,
  createCardPlace,
}: IProps): KlondikeStacksCreator {
  return () => {
    const deck = new KlondikeStack({
      id: KlondikeStackType.DECK,
      type: KlondikeStackType.DECK,
      cardPlace: createCardPlace(),
      layoutStrategy: cardLayout.deck,
    });

    const grave = new KlondikeStack({
      id: KlondikeStackType.GRAVE,
      type: KlondikeStackType.GRAVE,
      cardPlace: createCardPlace(),
      layoutStrategy: cardLayout.grave,
    });

    const bases = Array.from(new Array(BASES_AMOUNT)).map(
      (_, index) =>
        new KlondikeStack({
          id: `${KlondikeStackType.BASE}-${index}`,
          type: KlondikeStackType.BASE,
          cardPlace: createCardPlace(),
          layoutStrategy: cardLayout.base,
        }),
    );

    const piles = Array.from(new Array(PILES_AMOUNT)).map(
      (_, index) =>
        new KlondikeStack({
          id: `${KlondikeStackType.PILE}-${index}`,
          type: KlondikeStackType.PILE,
          cardPlace: createCardPlace(),
          layoutStrategy: cardLayout.pile,
        }),
    );

    layoutDefaultKlondike({
      scene,
      deck: deck.cardPlace,
      grave: grave.cardPlace,
      piles: piles.map((p) => p.cardPlace),
      bases: bases.map((b) => b.cardPlace),
    });

    return new KlondikeStackMap([deck, grave, ...bases, ...piles]);
  };
}
