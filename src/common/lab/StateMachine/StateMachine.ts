type StateHandler<State extends string, Data> = (
  stateMachine: StateMachine<State, Data>
) => void;

export class StateMachine<State extends string, Data> {
  private currentState: State | null = null;
  private states: Map<State, StateHandler<State, Data>> = new Map();
  private data: Data;
  private isDestroyed: boolean = false;
  private _isStopped: boolean = false;

  constructor(initialData: Data) {
    this.data = initialData;
  }

  add(state: State, handler: StateHandler<State, Data>): this {
    if (this.isDestroyed) {
      console.warn("Attempt to add state to destroyed StateMachine");
      return this;
    }
    this.states.set(state, handler);
    return this;
  }

  start(state: State): void {
    this._isStopped = false;
    this.go(state);
  }

  go(state: State): void {
    if (this.isDestroyed || this._isStopped) return;
    this.currentState = state;
    const handler = this.states.get(state);
    if (handler) {
      handler(this);
    } else {
      console.warn(`Нет обработчика для состояния ${state}`);
    }
  }

  getCurrentState(): State | null {
    return this.currentState;
  }

  getData(): Data {
    return this.data;
  }

  setData(newData: Partial<Data> | ((prevData: Data) => Partial<Data>)): void {
    if (this.isDestroyed) {
      console.warn("Attempt to set data in destroyed StateMachine");
      return;
    }
    if (typeof newData === "function") {
      const updater = newData as (prevData: Data) => Partial<Data>;
      this.data = { ...this.data, ...updater(this.data) };
    } else {
      this.data = { ...this.data, ...newData };
    }
  }

  stop(): void {
    this._isStopped = true;
  }

  get isStopped(): boolean {
    return this._isStopped;
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this._isStopped = true;
    this.currentState = null;
    this.states.clear();
    this.data = {} as Data;
  }
}
