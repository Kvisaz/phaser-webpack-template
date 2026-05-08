import { Align, AlignObject, layoutRow } from "@kvisaz/phaser-sugar";

export interface ILayoutDefaultKlondikeProps {
  scene: Phaser.Scene;
  deck: AlignObject;
  grave: AlignObject;
  bases: AlignObject[];
  piles: AlignObject[];
}

/** @bug - выравнивание групп по правому краю не работает!!! **/
const cardLeftPadding = 332;
const cardTopPadding = 32;
const cardGap = 32;

export function layoutDefaultKlondike({
  scene,
  deck,
  bases,
  grave,
  piles,
}: ILayoutDefaultKlondikeProps): void {
  const deckRow = layoutRow({
    children: [deck, grave],
    nextOffsetX: cardGap,
  });

  const pilesRow = layoutRow({
    children: [...piles],
    nextOffsetX: cardGap,
  });

  const basesRow = layoutRow({
    children: [...bases],
    nextOffsetX: cardGap,
  });

  const align = new Align();
  align.anchorSceneScreen(scene).topIn(deckRow, cardTopPadding).leftIn(deckRow, cardLeftPadding);
  align
    .anchor(deckRow)
    .bottomTo(pilesRow, cardGap * 2)
    .leftIn(pilesRow);
  align.anchor(deckRow).topIn(basesRow);
  align.anchor(pilesRow).rightIn(basesRow);

  [deck, ...bases, grave, ...piles].forEach((obj) =>
    scene.add.existing(obj as unknown as Phaser.GameObjects.GameObject),
  );
}
