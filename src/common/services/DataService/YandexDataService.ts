import { Player } from "ysdk";
import { DataServiceResult, InstantDataService } from "./types";

export class YandexDataService implements InstantDataService {
  protected cache: Record<string, unknown | undefined>;

  constructor(protected player: Player) {
    this.cache = {};
  }

  async preload(): Promise<void> {
    try {
      const data: unknown = await this.player.getData();
      if (data && typeof data === "object" && !Array.isArray(data)) {
        this.cache = data as Record<string, unknown>;
      }
    } catch (error) {
      console.warn(error);
    }
  }

  /**
   * сохранять можно данные любого пользователя, и авторизованного, и неавторизованного,
    поскольку у любого пользователя есть uniqueID с накопленным прогрессом
    если пользователь не авторизован, его uniqueID хранится локально.
    Поэтому uniqueID может измениться,
    если пользователь зайдет с другого браузера или устройства, либо удалиться,
    если пользователь очистит кэш браузера.
   **/

  getData<T>(key: string): T | undefined {
    return this.cache[key] as T | undefined;
  }

  setData<T>(key: string, value: T, onResult?: DataServiceResult): void {
    this.cache[key] = value;
    this.player.setData({ [key]: value } as Record<string, unknown>)
      .then(() => onResult?.({}))
      .catch((error) => onResult?.({ error }));
  }
}
