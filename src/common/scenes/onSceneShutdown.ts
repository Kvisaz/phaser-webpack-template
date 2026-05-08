/**
 * Подписка на `scene shutdown` с возможностью ранней ручной отписки.
 *
 * Зачем это добавлено:
 * - простой `scene.events.once(SHUTDOWN, ...)` живет до самого shutdown сцены;
 * - если владелец подписки уничтожается раньше (например, отдельная карта / feature / view-model),
 *   такой hook будет зря висеть на сцене до конца ее жизни;
 * - в long-lived сценах с повторными new game / replay это приводит к накоплению лишних shutdown-listeners.
 *
 * Какие кейсы лечит:
 * - per-object adapters поверх `scene.events` (`SceneEvents`, `SafeSceneEventsAdapter`);
 * - объекты, которые уничтожаются раньше, чем сама сцена;
 * - повторное создание большого количества подписчиков в пределах одной и той же сцены.
 */
export const onSceneShutdown = (scene: Phaser.Scene, onShutdown: () => void) => {
  let isActive = true;

  /**
   * Почему здесь не `scene.events.once(...)`:
   * - нам нужен ранний ручной `unSub`, если владелец умер до shutdown сцены;
   * - `once` сам снимается только после фактического `SHUTDOWN`, а этого недостаточно для long-lived сцен;
   * - поэтому держим явный `handler`, который можно снять через `off(...)` раньше.
   */
  const dispose = () => {
    if (!isActive) return false;
    isActive = false;
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, handler);
    return true;
  };

  const handler = () => {
    /** На реальном shutdown cleanup должен сработать ровно один раз и тоже снять свой hook. */
    if (!dispose()) return;
    onShutdown();
  };

  /** Регистрируем обычный `on`, потому что жизненным циклом этого hook теперь управляет `dispose()`. */
  scene.events.on(Phaser.Scenes.Events.SHUTDOWN, handler);

  /**
   * Позволяет снять shutdown-hook раньше, если владелец уже уничтожен до shutdown сцены.
   * Это критично для short-lived объектов внутри long-lived сцены.
   */
  return () => {
    dispose();
  };
};

/** функция которая привязывается к объекту и вызывает onDestroy
 * при уничтожении объекта или закрытии сцены**/
export function onDestroy(
  host: Phaser.Scene | Phaser.GameObjects.GameObject,
  onDestroy: () => void,
) {
  const scene = host instanceof Phaser.Scene ? host : host.scene;
  if (host instanceof Phaser.Scene) {
    onSceneShutdown(host, onDestroy);
  } else {
    host.on(Phaser.GameObjects.Events.DESTROY, onDestroy);
  }
}
