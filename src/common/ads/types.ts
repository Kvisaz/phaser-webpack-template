export interface IAdService {
  showCommonAd(opts: {
    onClose?: (args: {
      wasShown: boolean;
      error?: string;
    }) => void,
    onOpen?: () => void,
  }): void

  showRewardedAd(opts: {
    onClose?: (args: {
      wasShown: boolean;
      error?: string;
      isReward: boolean;
    }) => void,
    onOpen?: () => void,
  }): void
}
