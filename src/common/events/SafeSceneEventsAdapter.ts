import { TypedEventsEmitter } from "./TypedEventsEmitter";
import { onSceneShutdown } from "../scenes";

/**
 *  Обертка-адаптер для событий сцены
 *  автоматически отписывается при выключении сцены от тех событий,
 *  на которые подписались с его помощью
 *  - не выключает все листенеры, только свои!
 * **/
export class SafeSceneEventsAdapter<TypedEvents extends object> extends TypedEventsEmitter<TypedEvents> {
  private readonly unSubs = new Set<() => void>();
  /**
   * Отдельно храним unSub для scene shutdown-hook.
   *
   * Зачем это добавлено:
   * - адаптер может быть уничтожен раньше shutdown сцены;
   * - без этой ручки его pending `SHUTDOWN` listener висел бы на `scene.events` до конца жизни сцены.
   *
   * Какие кейсы лечит:
   * - per-card / per-widget `SceneEvents` экземпляры;
   * - replay/new game в рамках одной и той же сцены;
   * - накопление "мертвых" shutdown-listeners у уже уничтоженных объектов.
   */
  private readonly unSubSceneShutdown: () => void;

  constructor(scene: Phaser.Scene) {
    super(scene.events);
    this.unSubSceneShutdown = onSceneShutdown(scene, () => this.unSubscribeAll());
  }

  /**
   * Оборачивает отписку, чтобы:
   * 1) помнить именно наши слушатели,
   * 2) гарантировать, что базовый unSub дернётся ровно один раз,
   * даже если unsubscribe вызвали повторно вручную и затем из unSubscribeAll.
   */
  private trackUnSub(unSub: () => void) {
    const tracked = () => {
      if (!this.unSubs.has(tracked)) return;
      this.unSubs.delete(tracked);
      unSub();
    };
    this.unSubs.add(tracked);
    return tracked;
  }

  on<K extends Extract<keyof TypedEvents, string | symbol>>(
    event: K,
    callback: (data: TypedEvents[K]) => void,
  ): () => void {
    const safeCallback = (data: TypedEvents[K]) => {
      try {
        callback(data);
      } catch (error) {
        console.error("SafeSceneEventsAdapter listener error", error);
      }
    };
    return this.trackUnSub(super.on(event, safeCallback));
  }

  once<K extends Extract<keyof TypedEvents, string | symbol>>(
    event: K,
    callback: (data: TypedEvents[K] | undefined) => void,
    timeout?: number,
  ): () => void {
    const safeCallback = (data: TypedEvents[K] | undefined) => {
      try {
        callback(data);
      } catch (error) {
        console.error("SafeSceneEventsAdapter listener error", error);
      }
    };
    return this.trackUnSub(super.once(event, safeCallback, timeout));
  }

  async wait<K extends Extract<keyof TypedEvents, string | symbol>>(event: K): Promise<TypedEvents[K]> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let tracked: (() => void) | undefined;
      const baseUnSub = super.on(event, (data) => {
        if (settled) return;
        settled = true;
        tracked?.();
        resolve(data);
      });
      tracked = this.trackUnSub(() => {
        if (!settled) {
          settled = true;
          // Прерываем ожидание, если адаптер был очищен (например, при выключении сцены).
          reject(new Error(`SafeSceneEventsAdapter: scene disposed before event "${String(event)}" fired`));
        }
        baseUnSub();
      });
    });
  }

  unSubscribeAll() {
    Array.from(this.unSubs).forEach((unSub) => unSub());
    this.unSubs.clear();
    /** Снимаем и shutdown-hook, если сам адаптер больше не нужен до shutdown сцены. */
    this.unSubSceneShutdown();
  }
}
