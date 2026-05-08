import { Align } from "@kvisaz/phaser-sugar";
import { UnSubManager } from "../UnSubManager";
import { onSceneShutdown } from "./onSceneShutdown";

type UnSub = { destroy: () => void } | (() => void);

/**
 * Очищаемый  компонент для сцены
 * Вызывать только в createGO
 * автоматически вызывает destroy при остановке сцены / shutdown
 * позволяет  тестировать
 * - его работу и отключение в песочнице
 * **/
export class CleanableSceneView {
  protected align = new Align();
  protected unSubManager: UnSubManager = new UnSubManager();

  constructor(protected scene: Phaser.Scene) {
    onSceneShutdown(scene, this.destroy.bind(this));
    this.create();
  }

  addUnSub(clean: UnSub | UnSub[]) {
    this.unSubManager.addUnSub(clean);
  }

  /** redefine in your own child **/
  create() {
  }

  /** запускает очистку от подписок
   * можете добавить свои действи **/
  destroy() {
    console.log("CleanableSceneView destroy");
    this.unSubManager.clear();
  }
}

