import { launchScene } from "@kvisaz/phaser-sugar";
import { onSceneShutdown } from "./onSceneShutdown";

interface IProps {
  /** parent scene **/
  scene: Phaser.Scene;
  childSceneKey?: string;
  childScene?: Phaser.Scene;
  data?: object;
}

export type ChildSceneEntry = {
  childScene: Phaser.Scene;
  childSceneKey: string;
  destroy: () => void;
};

export function addChildScene({ scene, childSceneKey, childScene, data }: IProps): ChildSceneEntry {
  childSceneKey = childSceneKey ?? `childScene_${Date.now()}`;
  childScene = childScene ?? new Phaser.Scene(childSceneKey);

  /** запускаем сцену **/
  const destroy = launchScene({
    parentScene: scene,
    childScene,
    key: childSceneKey,
    data,
  });

  /** если родительская отключится - уберем и эту**/
  onSceneShutdown(scene, destroy);

  return { childScene, childSceneKey, destroy };
}
