import { AlignObject, launchScene } from "@kvisaz/phaser-sugar";
import { onSceneShutdown } from "../../scenes";
import { CommonModal, ICommonModalProps } from "./CommonModal";

type ChildObject = AlignObject & Phaser.GameObjects.GameObject;

/**
 * Управляющий хендл для модалки, запущенной в отдельной сцене.
 *
 * `close()` инициирует штатное закрытие через `CommonModal.EVENT_CLOSE_COMMAND`
 * и уважает анимацию/`onClose`.
 *
 * `destroy()` выполняет жёсткий teardown без ожидания анимации.
 */
export interface ICommonModalSceneHandle {
  sceneKey: string;
  close: (duration?: number) => void;
  destroy: () => void;
}

/**
 * Props для запуска `CommonModal` в отдельной scene-обёртке.
 */
export interface IOpenCommonModalInSceneProps {
  /**
   * Сцена, поверх которой будет показана модалка.
   *
   * Именно эта сцена будет поставлена на `pause()`, если она не была
   * остановлена/приостановлена вручную до вызова helper.
   */
  parentScene: Phaser.Scene;

  /**
   * Фабрика контента модалки.
   *
   * Функция вызывается уже внутри новой дочерней сцены. Возвращай сюда
   * любой `GameObject`, который должен стать телом модалки.
   *
   * Можно вернуть объект, который builder уже зарегистрировал в сцене:
   * `scene.add.existing(...)` повторно безопасен.
   */
  createContent: (scene: Phaser.Scene) => ChildObject;

  /**
   * Настройки `CommonModal`.
   *
   * `onClose` вызывается в штатном сценарии закрытия до финального teardown
   * сцены. Если нужен мгновенный teardown без анимации, используй `destroy()`
   * на возвращённом handle.
   */
  props?: Omit<ICommonModalProps, "content" | "isAutoOpen">;

  /**
   * Явный ключ сцены.
   *
   * Обычно не нужен. Если передаёшь его вручную, следи, чтобы ключ был
   * уникальным в `SceneManager` текущей игры.
   */
  sceneKey?: string;
}

interface ICommonModalSceneProps {
  createContent: (scene: Phaser.Scene) => ChildObject;
  modalProps: Omit<ICommonModalProps, "content" | "isAutoOpen">;
  onSceneClose: () => void;
}

let commonModalSceneIndex = 0;
const activeCommonModalScenes = new Map<string, ICommonModalSceneHandle>();

class CommonModalScene extends Phaser.Scene {
  private isSceneCloseRequested = false;

  constructor(private readonly props: ICommonModalSceneProps, sceneKey: string) {
    super(sceneKey);
  }

  create() {
    const requestSceneClose = () => {
      if (this.isSceneCloseRequested) return;
      this.isSceneCloseRequested = true;
      this.props.onSceneClose();
    };

    const content = this.props.createContent(this);
    this.add.existing(content);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, requestSceneClose);

    new CommonModal({
      ...this.props.modalProps,
      content,
      isAutoOpen: true,
      onClose: () => {
        try {
          this.props.modalProps.onClose?.();
        } finally {
          this.time.delayedCall(0, requestSceneClose);
        }
      },
    });
  }
}

/**
 * Запускает `CommonModal` в отдельной временной сцене.
 *
 * Это helper для случаев, когда модалка должна жить как полноценная сцена,
 * а не как просто объект внутри текущей сцены.
 *
 * Жизненный цикл:
 * - helper держит только одну активную modal-scene на `parentScene`;
 *   если открыть новую, предыдущая будет закрыта;
 * - helper создаёт уникальный `sceneKey` и запускает дочернюю сцену через
 *   `launchScene(...)`;
 * - внутри дочерней сцены вызывается `createContent(scene)`;
 * - результат `createContent` оборачивается в `CommonModal`;
 * - helper слушает shutdown дочерней сцены, чтобы cleanup срабатывал даже
 *   если модалку закрыли нештатно;
 * - если родительская сцена была активна, helper ставит её на `pause()`;
 * - закрытие модалки идёт через `handle.close(duration)` или
 *   `CommonModal.EVENT_CLOSE_COMMAND`;
 * - `handle.destroy()` делает жёсткий teardown без ожидания анимации;
 * - при завершении модалки helper снимает сцену-хост и, если нужно,
 *   возобновляет `parentScene`;
 * - если `parentScene` уничтожается раньше, cleanup отрабатывает без resume.
 *
 * Когда использовать:
 * - когда нужен отдельный сценовый lifecycle;
 * - когда модалка должна сама управлять overlay, анимацией и закрытием;
 * - когда важно явно паузить/возобновлять родительскую сцену.
 *
 * Когда не использовать:
 * - если контент уже живёт в текущей сцене и отдельная сцена не нужна;
 *   тогда достаточно `openCommonModal(...)`.
 *
 * Примеры:
 * ```ts
 * const modal = openCommonModalInScene({
 *   parentScene: scene,
 *   createContent: (modalScene) => {
 *     const builder = new ViewElementBuilder(modalScene);
 *     return builder.buttonSecondary("Close", () => {
 *       modalScene.events.emit(CommonModal.EVENT_CLOSE_COMMAND);
 *     });
 *   },
 *   props: {
 *     animationDuration: 180,
 *     isCloseOnOverlayClick: true,
 *   },
 * });
 * ```
 *
 * ```ts
 * modal.close(180);
 * ```
 *
 * ```ts
 * const modal = openCommonModalInScene({...});
 * scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
 *   modal.destroy();
 * });
 * ```
 */
export function openCommonModalInScene({
  parentScene,
  createContent,
  props = {},
  sceneKey,
}: IOpenCommonModalInSceneProps): ICommonModalSceneHandle {
  const parentSceneKey = parentScene.scene.key;
  activeCommonModalScenes.get(parentSceneKey)?.destroy();

  const modalSceneKey = sceneKey ?? `${parentSceneKey}.commonModal.${++commonModalSceneIndex}`;
  const shouldResumeParent = !parentScene.scene.isPaused(parentSceneKey);

  let isDestroyed = false;
  let launchDestroy = () => {};
  let disposeParentShutdown = () => {};
  let handle: ICommonModalSceneHandle | undefined;

  const destroy = (resumeParent = true) => {
    if (isDestroyed) return;
    isDestroyed = true;
    disposeParentShutdown();

    if (activeCommonModalScenes.get(parentSceneKey) === handle) {
      activeCommonModalScenes.delete(parentSceneKey);
    }

    try {
      launchDestroy();
    } finally {
      if (resumeParent && shouldResumeParent) {
        parentScene.scene.resume();
      }
    }
  };

  const close = (duration = 0) => {
    const modalScene = parentScene.scene.get(modalSceneKey) as Phaser.Scene | undefined;
    modalScene?.events.emit(CommonModal.EVENT_CLOSE_COMMAND, { duration });
  };

  handle = {
    sceneKey: modalSceneKey,
    close,
    destroy: () => destroy(true),
  };

  disposeParentShutdown = onSceneShutdown(parentScene, () => {
    destroy(false);
  });

  launchDestroy = launchScene({
    parentScene,
    childScene: new CommonModalScene(
      {
        createContent,
        modalProps: props,
        onSceneClose: () => destroy(true),
      },
      modalSceneKey,
    ),
    key: modalSceneKey,
  });

  if (isDestroyed) {
    launchDestroy();
    return handle;
  }

  parentScene.scene.bringToTop(modalSceneKey);
  if (isDestroyed) {
    launchDestroy();
    return handle;
  }

  if (shouldResumeParent) {
    parentScene.scene.pause();
  }

  if (isDestroyed) {
    launchDestroy();
    return handle;
  }

  activeCommonModalScenes.set(parentSceneKey, handle);

  return handle;
}
