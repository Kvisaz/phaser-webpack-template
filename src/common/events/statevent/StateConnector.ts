import { State, StateObserver, StateReducer, UnSubscriber } from "./StateEvent";

/**
 * Wraps a long-lived shared {@link State} instance and scopes the subscriptions per consumer.
 *
 * Game components can share the same State and still keep their teardown logic localized.
 * Each connector mirrors the State API while tracking its own un-subscribers so a component
 * can call {@link unSubScribeAll} once (for example in a destroy lifecycle hook)
 * without touching other observers that rely on the same State.
 */
export class StateConnector<TState> {
  private subscribers: UnSubscriber[] = [];

  constructor(protected state: State<TState>) {}

  getState(): TState {
    return this.state.getState();
  }

  on(callback: StateObserver<TState>, keys?: keyof TState | (keyof TState)[]): UnSubscriber {
    return this.trackSubscriber(this.state.on(callback, keys));
  }

  once(callback: StateObserver<TState>): UnSubscriber {
    return this.trackSubscriber(this.state.once(callback));
  }

  async await(): Promise<TState> {
    return new Promise<TState>((resolve) => {
      this.once(resolve);
    });
  }

  setState(state: StateReducer<TState> | TState) {
    this.state.setState(state);
  }

  emit(data: TState) {
    this.state.emit(data);
  }

  unSubScribeAll() {
    this.subscribers.forEach((unSub) => unSub());
    this.subscribers = [];
  }

  private trackSubscriber(unSub: UnSubscriber): UnSubscriber {
    const tracked: UnSubscriber = () => {
      unSub();
      this.removeSubscriber(tracked);
    };
    this.subscribers.push(tracked);
    return tracked;
  }

  private removeSubscriber(unSub: UnSubscriber) {
    const index = this.subscribers.indexOf(unSub);
    if (index >= 0) {
      this.subscribers.splice(index, 1);
    }
  }
}
