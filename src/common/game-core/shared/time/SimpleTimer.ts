export interface ISimpleTimerProps {
  intervalMs?: number;
  onTick: (currentSessionMs: number) => void;
  onPause?: (currentSessionMs: number) => void;
  onResume?: (currentSessionMs: number) => void;
  onEnd: (currentSessionMs: number) => void;
}

export class SimpleTimer {
  protected readonly intervalMs: number;
  protected currentSessionMs = 0;
  protected timerId?: ReturnType<typeof setInterval>;
  protected lastTickTimestampMs?: number;
  protected isPaused = false;

  constructor(protected readonly props: ISimpleTimerProps) {
    this.intervalMs = props.intervalMs && props.intervalMs > 0 ? props.intervalMs : 1000;
  }

  get isRunning(): boolean {
    return this.timerId !== undefined;
  }

  /** Запускает таймер, если не запущен */
  start() {
    if (this.isRunning) return;
    this.startInterval();
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    clearInterval(this.timerId);
    this.timerId = undefined;
    this.lastTickTimestampMs = undefined;
    this.props.onPause?.(this.currentSessionMs);
    this.isPaused = true;
  }

  resume() {
    if (this.isRunning || !this.isPaused) return;
    this.props.onResume?.(this.currentSessionMs);
    this.startInterval();
    this.isPaused = false;
  }

  /** Останавливает таймер и завершает сессию (onEnd вызовется единожды) */
  stop() {
    if (!this.isRunning) return;

    clearInterval(this.timerId);
    this.timerId = undefined;
    this.props.onEnd(this.currentSessionMs);
  }

  stopAndClear() {
    this.stop();
    this.currentSessionMs = 0;
    this.props.onTick(this.currentSessionMs);
  }

  protected startInterval() {
    this.lastTickTimestampMs = Date.now();
    this.timerId = setInterval(() => {
      const now = Date.now();
      const delta = now - (this.lastTickTimestampMs ?? now);
      this.currentSessionMs += delta;
      this.lastTickTimestampMs = now;
      this.props.onTick(this.currentSessionMs);
    }, this.intervalMs);
  }
}
