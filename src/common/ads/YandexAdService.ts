import { SDK } from "ysdk";
import { IAdService } from "./types";
import { getErrorMessage } from "../string";

export class YandexAdService implements IAdService {
  constructor(private sdk: SDK) {}

  showCommonAd(opts: {
    onClose?: (args: { wasShown: boolean; error?: string }) => void,
    onOpen?: () => void,
  }): void {
    const { onClose, onOpen } = opts;

    let isClosed = false;
    const safeClose = (args: { wasShown: boolean; error?: string }) => {
      if (isClosed) return;
      isClosed = true;
      onClose?.(args);
    };

    try {
      this.sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => onOpen?.(),
          onClose: (wasShown) => safeClose({ wasShown: Boolean(wasShown) }),
          onError: (error) => {
            safeClose({ wasShown: false, error: getErrorMessage(error) });
          },
          onOffline: () => safeClose({ wasShown: false, error: "offline" })
        }
      });
    } catch (error) {
      safeClose({ wasShown: false, error: getErrorMessage(error) });
    }
  }

  showRewardedAd(opts: {
    onClose?: (args: { wasShown: boolean; error?: string; isReward: boolean }) => void,
    onOpen?: () => void,
  }): void {
    const { onClose, onOpen } = opts;

    let isClosed = false;
    let wasRewarded = false;
    const safeClose = (args: { wasShown: boolean; error?: string; isReward: boolean }) => {
      if (isClosed) return;
      isClosed = true;
      onClose?.(args);
    };

    try {
      this.sdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => onOpen?.(),
          onRewarded: () => {
            wasRewarded = true;
          },
          onClose: () => safeClose({ wasShown: wasRewarded, isReward: wasRewarded }),
          onError: (error) => {
            safeClose({ wasShown: false, isReward: false, error: getErrorMessage(error) });
          }
        }
      });
    } catch (error) {
      safeClose({ wasShown: false, isReward: false, error: getErrorMessage(error) });
    }
  }
}
