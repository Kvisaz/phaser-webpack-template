import { AlignObject } from "@kvisaz/phaser-sugar";
import { onSceneShutdown } from "../../scenes";
import { CommonModal, ICommonModalProps } from "./CommonModal";

type DialogContent = AlignObject & Phaser.GameObjects.GameObject;

/**
 * Хендл открытого диалога в текущей сцене.
 *
 * `close()` запускает штатное закрытие через `CommonModal`:
 * оверлей убирается, контент уничтожается, `onClose` вызывается.
 *
 * `destroy()` нужен для жесткой очистки, например при destroy владельца.
 */
export interface ISceneDialogHandle {
  close: (duration?: number) => void;
  destroy: () => void;
}

/**
 * Props для простого диалога, который живет в той же Phaser-сцене.
 *
 * В отличие от `openCommonModalInScene`, этот helper не создает отдельную
 * scene и не ставит родительскую сцену на pause.
 */
export interface IOpenSceneDialogProps
  extends Omit<ICommonModalProps, "content" | "isAutoOpen"> {
  scene: Phaser.Scene;
  /**
   * Фабрика контента диалога.
   *
   * Контент создается прямо в `scene`. В фабрику передается `close`, чтобы
   * кнопки внутри диалога не знали про внутренние события `CommonModal`.
   */
  createContent: (props: {
    scene: Phaser.Scene;
    close: (duration?: number) => void;
  }) => DialogContent;
}

/**
 * Открывает `CommonModal` в текущей сцене без создания дополнительной сцены.
 *
 * Подходит для простых popup/dialog сценариев:
 * настройки, confirm, выбор стиля, короткие информационные окна.
 *
 * Не подходит для сценариев, где нужно паузить игру через Phaser SceneManager.
 * Для этого остается `openCommonModalInScene`.
 */
export function openSceneDialog({
  scene,
  createContent,
  onClose,
  ...modalProps
}: IOpenSceneDialogProps): ISceneDialogHandle {
  /** Ссылки нужны только для контролируемого cleanup. */
  let modal: CommonModal | undefined;
  let content: DialogContent | undefined;
  let isDestroyed = false;
  let disposeSceneShutdown = () => {};

  /** Штатное закрытие: дает `CommonModal` выполнить анимацию и вызвать `onClose`. */
  const close = (duration = 0) => {
    modal?.close(duration);
  };

  /**
   * Единая точка очистки.
   *
   * `isDestroyModal` нужен, чтобы не вызывать `modal.destroy()` повторно после
   * штатного закрытия: в этом случае `CommonModal` уже убрал overlay сам.
   */
  const cleanup = (isDestroyModal: boolean) => {
    if (isDestroyed) return;
    isDestroyed = true;
    disposeSceneShutdown();

    if (isDestroyModal) {
      modal?.destroy();
    }

    content?.destroy();
    modal = undefined;
    content = undefined;
  };

  /** Создаем контент до `CommonModal`, чтобы передать его как тело модалки. */
  content = createContent({ scene, close });
  scene.add.existing(content);

  /** `CommonModal` управляет overlay, позицией и анимацией появления/закрытия. */
  modal = new CommonModal({
    ...modalProps,
    content,
    isAutoOpen: true,
    onClose: () => {
      onClose?.();
      cleanup(false);
    },
  });

  /** Если сцена закрылась раньше диалога, чистим ссылки и объекты без анимации. */
  disposeSceneShutdown = onSceneShutdown(scene, () => {
    cleanup(true);
  });

  /** Возвращаем наружу минимальный управляющий интерфейс. */
  return {
    close,
    destroy: () => cleanup(true),
  };
}
