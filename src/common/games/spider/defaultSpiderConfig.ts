import { ISpiderConfig } from "./types";

const flipDuration = 100;
const moveDuration = 220;
const dealMoveDuration = 120;
const dealFromLayoutDuration = 90;

export const defaultSpiderConfig: ISpiderConfig = {
  suitsMode: 1,
  allowMeaninglessHints: false,
  allowDealWithEmptyTableau: true,
  moveConfig: {
    animationEnabled: true,
    moveDuration,
    fromLayoutDuration: 160,
    dealMoveDuration,
    dealFromLayoutDuration,
    flipDuration,
    isAnimatedFirstDeal: true,
    wrongMoveShakeDuration: 260,
  },
};
