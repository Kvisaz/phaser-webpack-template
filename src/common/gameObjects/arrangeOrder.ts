import { getGameObjectParent } from "./getGameObjectParent";

export enum ArrangeOrder {
  top = "top",
  back = "back",
  below = "below",
  above = "above",
}

export const arrangeOrder = (
  obj: Phaser.GameObjects.GameObject,
  order: ArrangeOrder,
  anchor?: Phaser.GameObjects.GameObject,
) => {
  const gameObjectParent = getGameObjectParent(obj);
  if (gameObjectParent == null) return;

  if (order === ArrangeOrder.top) {
    gameObjectParent.bringToTop(obj);
    return;
  }

  if (order === ArrangeOrder.back) {
    gameObjectParent.sendToBack(obj);
    return;
  }

  if (anchor == null) return;
  const anchorParent = getGameObjectParent(anchor);
  if (anchorParent !== gameObjectParent) return;

  if (order === ArrangeOrder.below) {
    gameObjectParent.moveBelow(obj, anchor);
    return;
  }

  if (order === ArrangeOrder.above) {
    gameObjectParent.moveAbove(obj, anchor);
    return;
  }
};

export const bringToTop = (obj: Phaser.GameObjects.GameObject) => {
  arrangeOrder(obj, ArrangeOrder.top);
};

export const bringToBack = (obj: Phaser.GameObjects.GameObject) => {
  arrangeOrder(obj, ArrangeOrder.back);
};
