/**
 *  В игре есть глобальное состояние
 *  оно может быть загружено при старте
 *  и сохранено в любой момент
 *
 *  Состояние может содержать что угодно - по сути это memoryStorage,
 *  очень быстрое хранилище
 *
 *  Оно очень простое и надежное
 ***/
export class MemoryStorage {
  private coreState: Record<string, unknown> = {};

  /** единственный коллбэк на сохранение **/
  onSave?: (state: Record<string, unknown>) => void;

  private onSaveCallback = () => {
    this.onSave?.(deepCopy(this.coreState));
  };

  /** загрузка данных **/
  load(state: Record<string, unknown>): void {
    this.coreState = deepCopy(state);
  }

  get<T>(key: string): T | undefined {
    return this.coreState[key] as T | undefined;
  }

  set<T>(key: string, value: T): void;
  set<T>(key: string, updater: (previousValue: T) => T): void;

  // Реальная реализация
  set<T>(key: string, valueOrUpdater: T | ((previousValue: T) => T)): void {
    const previousValue = this.coreState[key] as T;

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as (previousValue: T) => T)(previousValue)
        : valueOrUpdater;

    this.coreState[key] = nextValue;
    /** вызываем коллбэк на сохранение **/
    this.onSaveCallback();
  }
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
