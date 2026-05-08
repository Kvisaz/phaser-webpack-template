import { Player, SDK } from "ysdk";

interface IProps {
  isLogging?: boolean;
}

export class YandexSdkWrapper {
  protected sdk: SDK | undefined;
  protected player: Player | undefined;

  constructor(private props: IProps = {}) {}

  async init() {
    try {
      if (typeof YaGames === "undefined" || YaGames == null) {
        this.log("YaGames unavailable");
        return;
      }
      if (this.sdk == null) {
        this.sdk = await YaGames.init();
      }
      await this.initPlayer();
    } catch (e) {
      this.log(e);
    }
  }

  getSDK(): SDK | undefined {
    return this.sdk;
  }

  getPlayer(): Player | undefined {
    return this.player;
  }

  protected async initPlayer(): Promise<void> {
    try {
      this.player = await this.sdk?.getPlayer();
    } catch (error) {
      this.log(error);
    }
  }

  protected log(...args: unknown[]) {
    if (this.props.isLogging !== true) return;
    console.log(...args);
  }
}
