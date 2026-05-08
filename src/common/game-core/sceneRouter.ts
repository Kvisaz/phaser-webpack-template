import { isSceneKey, Scenes } from "./scenesNames";

type SceneData = object | undefined;

export class ScenesRouter {
  constructor(protected scene: Phaser.Scene) {
  }

  start<T extends SceneData>(key: Scenes, data?: T) {
    this.scene.scene.start(key, data);
  }

  showGameFromLevelMap<T extends SceneData>(data?: T) {
    this.start(Scenes.Game, data);
  }

  showGameOver<T extends SceneData>(data?: T) {
    this.scene.scene.pause();
    this.scene.scene.launch(Scenes.GameOver, data);
  }

  showFullAdFromGameOver<T extends SceneData>(data?: T) {
    this.scene.scene.stop(Scenes.GameOver);
    this.scene.scene.stop(Scenes.Game);
    this.start(Scenes.AdFullScreen, data);
  }

  restartFromGameOver<T extends SceneData>(data?: T) {
    this.scene.scene.stop(Scenes.Game);
    this.scene.scene.stop(Scenes.GameOver);
    this.start(Scenes.Game, data);
  }

  restartFromFullAd<T extends SceneData>(data?: T) {
    this.start(Scenes.Game, data);
  }
}
