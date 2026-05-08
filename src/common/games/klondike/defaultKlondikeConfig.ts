import { IKlondikeConfig } from "./types";

const flipDuration = 100;
const moveDuration = 250;

export const defaultKlondikeConfig: IKlondikeConfig = {
  moveConfig: {
    animationEnabled: true,
    pickDeckCardMoveDuration: moveDuration,
    pickDeckCardFlipDuration: flipDuration,
    deckRecycleDuration: 400,
    transferMoveDuration: moveDuration,
    transferFromLayoutDuration: moveDuration,
    transferPileFlipDuration: flipDuration,
    wrongCardShakeDuration: moveDuration,
    magicLiftDuration: 180,
    magicFlipDuration: flipDuration,
    magicMoveDuration: moveDuration,
    magicFromLayoutDuration: moveDuration,
  },
  dealConfig: {
    layoutFromDuration: 100,
    moveDuration: 150,
    flipDuration: 100,
    cardStepDuration: 80,
  },
  statelessAnimationConfig: {
    visionFlipDuration: 150,
    visionShowDuration: 800,
  },
  tricksConfig: {
    /** если true
     * - воспринимает клик по pile как приказ взять из нее максимальную стопку
     * если false - отсчитывает только с этой карты
     * **/
    autoMoveMaximize: true,
  },
};
