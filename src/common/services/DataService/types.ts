/**
 * универсальная оболочка для всех дата-сервисов
 * с внутренним кэшем
 * **/
export interface InstantDataService {
  /** загрузка в кэш из реализации **/
  preload(): Promise<void>;

  /**
   * моментальное сохранение в кэш,
   * запуск сохранения в реализациюю
   * **/
  setData<T>(key: string, value: T, onResult?: DataServiceResult): void;

  /**
   * моментальное чтение из кэша
   * **/
  getData<T>(key: string): T | undefined;
}

export interface InstantDataServiceResult {
  error?: any;
}

export type DataServiceResult = (result: InstantDataServiceResult)=>void;
