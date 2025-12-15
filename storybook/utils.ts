import { IStory } from "./interfaces";

interface ICreateSceneStoryProps {
  title: string;
  childScene: Phaser.Scene;
  data?: object;
}

export function createSceneStory({ title, childScene, data }: ICreateSceneStoryProps): IStory {
  return {
    title,
    run: async (parentScene: Phaser.Scene) => {
      const unSub = launchScene({
        parentScene,
        key: title,
        childScene,
        data
      });

      return () => {
        console.log('unSub!!!!')
        unSub();
      };
    },
  };
}

interface ILaunchProps {
  parentScene: Phaser.Scene;
  key: string;
  childScene: Phaser.Scene;
  data?: object;
}

/** запустить сцену в текущей сцене, возвращает отписку **/
export function launchScene({ parentScene, key, childScene, data }: ILaunchProps): () => void {
  const sceneManager = parentScene.scene;
  sceneManager.add(key, childScene, true, data);

  return () => {
    parentScene.scene.stop(key);
    parentScene.game.scene.remove(key);
  };
}
