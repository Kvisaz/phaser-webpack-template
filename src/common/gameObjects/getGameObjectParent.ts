export const getGameObjectParent = (
  obj: Phaser.GameObjects.GameObject,
): Phaser.GameObjects.Container | Phaser.GameObjects.DisplayList | undefined => {
  return obj.parentContainer ?? obj.scene?.children;
};
