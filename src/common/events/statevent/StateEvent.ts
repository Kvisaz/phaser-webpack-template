/**
 * Lightweight observable for synchronous state or event streams.
 *
 * - `setState`/`emit` instantly notify all subscribers (no async queueing).
 * - `on`/`once` return an unsubscribe callback; optional `keys` lets you pass a key
 *   or list of keys from the state shape to shallow-compare against `prevState`
 *   and fire only when at least one of them changes.
 * - `await` resolves on the next state/event emission (handy in tests or flows awaiting one update)
 *   and rejects if all subscribers are cleared before it fires.
 * - `unSubScribeAll` drops every observer at once.
 * - Errors in handlers are caught so other subscribers still fire; errors are logged to console.
 *
 * Pair with {@link State} when you always need an initial value and reducer-style updates.
 */
export class StateEvent<TState> {
  public subscribers = new Set<StateObserver<TState>>();
  protected prevState?: TState;
  private pendingAwaitRejects = new Set<() => void>();

  constructor(protected state?: TState) {}

  /**
   * Returns the current state value.
   * @example
   * const current = stateEvent.getState();
   */
  getState(): TState | undefined {
    return this.state;
  }

  /**
   * Subscribes to updates. Pass `keys` to trigger only when those fields change.
   * @example
   * const off = stateEvent.on((s) => console.log(s.score), "score");
   * // later
   * off();
   */
  on(callback: StateObserver<TState>, keys?: keyof TState | (keyof TState)[]): UnSubscriber {
    const selectedCallback: StateObserver<TState> =
      keys == null
        ? callback
        : (state: TState) => {
            const observedKeys = Array.isArray(keys) ? keys : [keys];
            const { prevState } = this;

            // проверка что изменились некоторые ключи
            if (
              prevState == null ||
              state == null ||
              observedKeys.some((key) => prevState[key] !== state[key])
            ) {
              callback(state);
            }
          };

    this.subscribers.add(selectedCallback);
    return () => {
      this.subscribers.delete(selectedCallback);
    };
  }

  /**
   * Subscribes once and auto-unsubscribes after the first call.
   * @example
   * stateEvent.once((s) => console.log("first", s));
   */
  once(callback: StateObserver<TState>): UnSubscriber {
    const autoUnSub: StateObserver<TState> = (state) => {
      try {
        callback(state);
      } finally {
        this.subscribers.delete(autoUnSub);
      }
    };
    return this.on(autoUnSub);
  }

  /**
   * Returns a promise that resolves with the next state/event; rejects if listeners are cleared first.
   * @example
   * const next = await stateEvent.await().catch(() => undefined);
   */
  async await(): Promise<TState> {
    return new Promise<TState>((resolve, reject) => {
      let onCancel: () => void;

      const cleanup = () => {
        this.pendingAwaitRejects.delete(onCancel);
        unSub();
      };

      const unSub = this.once((state) => {
        cleanup();
        resolve(state);
      });

      onCancel = () => {
        cleanup();
        reject(new Error("StateEvent await cancelled"));
      };

      this.pendingAwaitRejects.add(onCancel);
    });
  }

  /**
   * Pushes a new state value and notifies subscribers.
   * @example
   * stateEvent.setState({ score: 10 });
   */
  setState(state: TState) {
    this.prevState = this.state != null ? this.state : this.prevState;
    this.subscribers.forEach((fn) => {
      try {
        fn(state);
      } catch (error) {
        console.error("StateEvent subscriber error", error);
      }
    });
    this.state = state;
  }

  //Syntax sugar for Event case
  /**
   * Alias for {@link setState} when treating the value as an event payload.
   * @example
   * stateEvent.emit("game-over");
   */
  emit(data: TState) {
    this.setState(data);
  }

  /**
   * Removes all subscribers and rejects pending awaits.
   * @example
   * stateEvent.unSubScribeAll();
   */
  unSubScribeAll() {
    this.pendingAwaitRejects.forEach((reject) => reject());
    this.pendingAwaitRejects.clear();
    this.subscribers.clear();
  }
}

/** Всегда имеет значение по дефолту. */
export class State<T> extends StateEvent<T> {
  constructor(protected state: T) {
    super(state);
  }

  /**
   * Returns the current state value (never undefined for State).
   * @example
   * const score = state.getState();
   */
  getState(): T {
    return this.state;
  }

  /**
   * Applies a new state or reducer, then notifies subscribers.
   * @example
   * state.setState((prev) => ({ ...prev, score: prev.score + 1 }));
   */
  setState(state: StateReducer<T> | T) {
    this.prevState = this.state != null ? this.state : this.prevState;
    const newState = typeof state === "function" ? (state as StateReducer<T>)(this.state) : state;
    this.subscribers.forEach((fn) => {
      try {
        fn(newState);
      } catch (error) {
        console.error("State subscriber error", error);
      }
    });
    this.state = newState;
  }
}

export type UnSubscriber = () => void;
export type StateObserver<TState> = (state: TState) => void;
export type StateReducer<TState> = (state: TState) => TState;

export type Observable<T> = {
  getState(): T;
  on(callback: StateObserver<T>, keys?: keyof T | (keyof T)[]): UnSubscriber;
  once(callback: StateObserver<T>): UnSubscriber;
};

export type Controller<T> = {
  setState(state: StateReducer<T> | T): void;
};
