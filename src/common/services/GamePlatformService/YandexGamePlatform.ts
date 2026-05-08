import { Payments, Player, Product, SDK } from "ysdk";
import {
  IGamePlatformInterface,
  InAppDto,
  InAppPurchaseArgs,
  IPurchase,
  Serializable,
  UserPayingStatus
} from "./types";

interface IProps {
  isLogging?: boolean;
  isConsumable: (id: string) => boolean;
  activateConsumableInApp: (id: string) => Promise<void>;
}

type YandexGamePlatformState = {
  player?: Player;
  ysdk?: SDK;
  payments?: Payments;
  inAps?: Product[];
  purchases?: IPurchase[];
  language?: string;
};

export class YandexGamePlatform implements IGamePlatformInterface {
  private state: YandexGamePlatformState = {};

  constructor(protected props: IProps) {
  }

  get isEnabled() {
    return YaGames != null;
  }

  async init(): Promise<void> {
    try {
      await this.initSDK();
      await Promise.all([this.initPlayer(), this.initPayments()]);
    } catch (e) {
      this.warn(e);
    }
  }

  gamePlayStart(): void {
    this.state.ysdk?.features.GameplayAPI.start();
  }

  gamePlayStop(): void {
    this.state.ysdk?.features.GameplayAPI.stop();
  }

  gameReady(): void {
    this.state.ysdk?.features.LoadingAPI?.ready();
  }

  async setData<T extends Record<string, unknown>>(data: T): Promise<void> {
    await this.state.player?.setData(data);
  }

  async getData(keys?: string[]): Promise<Partial<Record<string, Serializable>> | undefined> {
    const data = await this.state.player?.getData(keys);
    return data;
  }

  getUserPayingStatus(): UserPayingStatus | undefined {
    return this.state.player?.getPayingStatus();
  }

  serverTime(): number | undefined {
    return this.state.ysdk?.serverTime();
  }

  async getStats(keys?: string[]): Promise<Partial<Record<string, number>> | undefined> {
    const data = await this.state.player?.getStats(keys);
    return data;
  }

  async setStats(stats: Record<number | string, number>): Promise<void> {
    await this.state.player?.setStats(stats);
  }

  language(): string | undefined {
    return this.state.ysdk?.environment.i18n.lang;
  }

  /** реклама **/

  showFullscreenAdv(opts?: {
    callbacks?: {
      onClose?: (wasShown: boolean) => void;
      onError?: (error: Error) => void;
      onOffline?: () => void;
      onOpen?: () => void;
    };
  }) {
    this.state.ysdk?.adv.showFullscreenAdv(opts);
  }

  showRewardedVideo(opts?: {
    callbacks?: {
      onClose?: () => void;
      onError?: (error: Error) => void;
      onOpen?: () => void;
      onRewarded?: () => void;
    };
  }): void {
    this.state.ysdk?.adv.showRewardedVideo(opts);
  }

  /** Покупки **/

  /** загрузи заранее - в init, верни сейчас**/
  inAppCatalog(): InAppDto[] | undefined {
    return this.state.inAps;
  }

  inAppPurchases(): IPurchase[] | undefined {
    return this.state.purchases;
  }

  async inAppPurchasesUpdate(): Promise<IPurchase[] | undefined> {
    try {
      const { payments } = this.state;
      if (payments == null) return;
      const purchases = await payments.getPurchases();
      this.setState({ purchases });
      return purchases;
    } catch (e) {
      this.warn("inAppPurchaseConsumable error", e);
    }
  }

  async inAppPurchaseConsumable({ id }: InAppPurchaseArgs): Promise<void> {
    try {
      const { payments } = this.state;
      // говорим купить
      const purchase = await payments?.purchase({ id });
      if (purchase == null) throw new Error("purchase null");
      // начисляем на баланс игрока и отписываем в API
      await this.inAppActivateConsumable(purchase);
    } catch (e) {
      // Покупка не удалась: в Консоли разработчика не добавлен товар с таким id,
      // пользователь не авторизовался, передумал и закрыл окно оплаты,
      // истекло отведенное на покупку время, не хватило денег и т. д.
      this.warn("inAppPurchaseConsumable error", e);
    }
  }

  async inAppActivateConsumable(purchase: IPurchase): Promise<void> {
    try {
      if (!this.props.isConsumable(purchase.productID)) return;
      const { payments } = this.state;
      if (payments == null) return;
      await this.props.activateConsumableInApp(purchase.productID);
      await payments.consumePurchase(purchase.purchaseToken);
    } catch (e) {
      this.warn(e);
    }
  }

  /******
   * private
   *****/

  private log(...args: unknown[]) {
    if (this.props.isLogging !== true) return;
    console.log(...args);
  }

  private warn(...args: unknown[]) {
    console.warn(...args);
  }

  private setState(fields: Partial<YandexGamePlatformState>) {
    this.state = {
      ...this.state,
      ...fields
    };
  }

  private async initSDK() {
    try {
      if (!this.isEnabled) {
        this.log("YaGames == null, no Yandex SDK");
        return;
      }
      const ysdk = await YaGames.init();
      this.setState({
        ysdk,
        language: ysdk.environment.i18n.lang
      });
      this.log("YandexGames inited lang", this.state.language);
    } catch (e) {
      this.log(e);
    }
  }

  private async initPlayer() {
    try {
      const player = await this.state?.ysdk?.getPlayer();
      this.setState({ player });
      if (player) this.log("initPlayer success", player.getUniqueID());
      else this.log("initPlayer got undefined");
    } catch (e) {
      this.log("initPlayer error", e);
    }
  }

  private async initPayments() {
    try {
      const payments = await this.state?.ysdk?.getPayments();
      this.setState({ payments });

      if (payments == null) {
        this.log("initPayments got undefined");
        return;
      }

      this.log("initPayments success");
      await this.initShopProducts();
      await this.checkPurchases();
    } catch (e) {
      this.log("initPayments error", e);
    }
  }

  private async initShopProducts() {
    try {
      const { payments } = this.state;
      if (payments == null) {
        this.log("initShopProducts = payments==null");
        return;
      }
      const inAps = await payments.getCatalog();
      if (inAps != null) {
        this.log("initShopProducts success", inAps);
        this.setState({ inAps });
      }
    } catch (e) {
      this.log("initShopProducts error", e);
    }
  }

  /** проверить необработанные покупки **/
  private async checkPurchases() {
    const { payments } = this.state;
    if (payments == null) return;
    const purchases = await payments.getPurchases();
    this.setState({ purchases });
    for (const purchase of purchases) {
      if (!this.props.isConsumable(purchase.productID)) continue;
      await this.inAppActivateConsumable(purchase);
    }
  }
}
