export interface IGamePlatformInterface {
  /** проверка на SDK **/
  isEnabled: boolean;

  /**
   * инициализация и прелоад в случае успеха
   * **/
  init(): Promise<void>;

  /** возвращает язык пользователя **/
  language(): string | undefined;

  /**
   * Возвращает время в мс, синхронизированное с сервером.
   Например, 1720613073778.
   **/
  serverTime(): number | undefined;

  /**
   * @analytic - метрика Game Ready
   * смотреть можно во вкладке Performance в DevTools.
   * нужно вызывать, когда игра загрузила все ресурсы
   * и готова к взаимодействию с пользователем. **/
  gameReady(): void;

  /**  когда игрок начинает или возобновляет игровой процесс **/
  gamePlayStart(): void;

  /**  когда игрок приостанавливает или завершает игровой процесс **/
  gamePlayStop(): void;

  /** платежный статус игрока, требует предварительной загрузки **/
  getUserPayingStatus(): UserPayingStatus | undefined;

  /**
   * сохраняет данные пользователя, < 200 KБ
   - data — object — объект, содержащий пары ключ-значение
   **/
  setData<T extends Record<string, unknown>>(data: T): Promise<void>;

  /** асинхронно возвращает внутриигровые данные
   * Если параметр keys отсутствует, то метод возвращает все внутриигровые данные пользователя.**/
  getData(keys?: string[]): Promise<Partial<Record<string, Serializable>>|undefined>;

  /** менее 10 кб, быстро и часто меняющиеся данные **/
  setStats(stats: Record<number | string, number>): Promise<void>;

  getStats(keys?: string[]): Promise<Partial<Record<string, number>>|undefined>

  /** реклама **/
  showFullscreenAdv(opts?: {
    callbacks?: {
      onClose?: (wasShown: boolean) => void;
      onError?: (error: Error) => void;
      onOffline?: () => void;
      onOpen?: () => void;
    }
  }): void;


  showRewardedVideo(opts?: {
    callbacks?: {
      onClose?: () => void;
      onError?: (error: Error) => void;
      onOpen?: () => void;
      onRewarded?: () => void;
    };
  }): void;


  /** Покупки **/

  /** список товаров для продажи **/
  inAppCatalog(): InAppDto[] | undefined;

  /** список покупок игрока **/
  inAppPurchases(): IPurchase[] | undefined;
  inAppPurchasesUpdate(): Promise<IPurchase[]|undefined>;

  /** купить и зачислить расходный товар**/
  inAppPurchaseConsumable(args: InAppPurchaseArgs): Promise<void>;
  /** купить и зачислить вечное изменение **/
  // inAppPurchaseUpgrade(opts?: { developerPayload?: string; id: string }): Promise<Purchase>;

  inAppActivateConsumable(purchase: IPurchase): Promise<void>;
}

export interface InAppPurchaseArgs {
  id: string
}

export type Serializable = { [key: string]: Serializable } | Serializable[] | boolean | null | number | string;

export type UserPayingStatus =
  | "paying" // купил портальную валюту на сумму более 500 рублей за последний месяц
  | "partially_paying" // была хотя бы одна покупка портальной валюты реальными деньгами за последний год'
  | "not_paying" // не делал покупок портальной валюты реальными деньгами за последний год'
  | "unknown"; //— не из РФ или он не разрешил передачу такой информации разработчику.'

export interface InAppDto {
  id: string;
  title: string;
  description: string;
  price: string;
  priceValue?: string;
  priceCurrencyCode: string;
  imageURI?: string;
  getPriceCurrencyImage(size: "medium" | "small" | "svg"): string;
}

export interface IPurchase {
  developerPayload?: string;
  productID: string;
  purchaseToken: string;
}
