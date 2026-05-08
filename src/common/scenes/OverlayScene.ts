import { addChildScene, ChildSceneEntry } from "./addChildScene";

/**
 * Максимально простой способ получить оверлей для текущей сцены
 * - OverlayScene.get(scene)
 *
 * Ожидает что всегда будет одна сцена с таким именем
 * поэтому подключать надо только к основным сценам
 * вроде GameScene, StartScene
 **/
export class OverlayScene {
  private static overlay: ChildSceneEntry | undefined;
  static sceneKey = "OverlayScene";

  /**
   * включить оверлей сцену к текущей сцене
   * - оверлей сцена автоматически разрушится и уберется из списка при закрытии родителя
   * **/
  static attach(parent: Phaser.Scene) {
    if (parent.scene.get(this.sceneKey) != null) return;

    this.overlay = addChildScene({
      scene: parent,
      childSceneKey: this.sceneKey
    });
  }

  static get(parent: Phaser.Scene): Phaser.Scene {
    if (parent.scene.get(this.sceneKey) == null) {
      this.attach(parent);
    }
    return parent.scene.get(this.sceneKey);
  }

  static destroy() {
    console.log("OverlayScene destroy, has overlay = ", this.overlay != null);
    this.overlay?.destroy();
  }
}
