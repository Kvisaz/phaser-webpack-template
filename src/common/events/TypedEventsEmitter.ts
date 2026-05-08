export class TypedEventsEmitter<TypedEvents extends object> {
  constructor(protected emitter = new Phaser.Events.EventEmitter()) {
  }

  unSubscribeAll() {
    this.emitter.removeAllListeners();
  }

  on<K extends Extract<keyof TypedEvents, string | symbol>>(
    event: K,
    callback: (data: TypedEvents[K]) => void
  ): () => void {
    this.emitter.on(event, callback as (...args: unknown[]) => void);
    return () => this.off(event, callback);
  }

  once<K extends Extract<keyof TypedEvents, string | symbol>>(
    event: K,
    callback: (data: TypedEvents[K] | undefined) => void,
    timeout?: number
  ): () => void {
    this.emitter.once(event, callback);

    let timeoutId: number | undefined;

    if (timeout) {
      timeoutId = window.setTimeout(() => {
        this.off(event, callback);
        callback(undefined);
      }, timeout);
    }

    return () => {
      this.off(event, callback);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  async wait<K extends Extract<keyof TypedEvents, string | symbol>>(event: K): Promise<TypedEvents[K]> {
    return new Promise((resolve) => {
      this.emitter.once(event, resolve as (...args: unknown[]) => void);
    });
  }

  off<K extends Extract<keyof TypedEvents, string | symbol>>(event: K, callback: (data: TypedEvents[K]) => void) {
    this.emitter.off(event, callback as (...args: unknown[]) => void);
  }

  emit<K extends Extract<keyof TypedEvents, string | symbol>>(event: K, data?: TypedEvents[K]) {
    this.emitter.emit(event, ...(data !== undefined ? [data] : []));
  }
}

/** только излучать **/
export interface EmitterOnly<TypedEvents extends object>{
  emit<K extends Extract<keyof TypedEvents, string | symbol>>(event: K, data?: TypedEvents[K]): void;
  /** кто излучает - тот и может отписываться **/
  unSubscribeAll(): void;
}

/** только слушать,
 *  подписчик не может отписываться за всех - но имеет доступ к своим отписчикам **/
export interface SubscribeOnly<TypedEvents extends object>{
  on<K extends Extract<keyof TypedEvents, string | symbol>>(
    event: K,
    callback: (data: TypedEvents[K]) => void
  ): () => void;
  once<K extends Extract<keyof TypedEvents, string | symbol>>(
    event: K,
    callback: (data: TypedEvents[K] | undefined) => void,
    timeout?: number
  ): () => void
}
