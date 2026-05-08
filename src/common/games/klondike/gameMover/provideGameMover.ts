import { IKlondikeMoveConfig, IKlondikeStackMap } from "../types";
import { IKlondikeGameMover } from "./types";
import { AnimatedGameMover } from "./AnimatedGameMover";
import { InstantGameMover } from "./InstantGameMover";
import { KlondikeRules } from "../rules";

interface IProps {
  moveConfig: IKlondikeMoveConfig;
  stackMap: IKlondikeStackMap;
  klondikeRules: KlondikeRules;
}
export function provideGameMover(props: IProps): IKlondikeGameMover{
  if(props.moveConfig.animationEnabled) return new AnimatedGameMover(props);
  else return new InstantGameMover(props);
}
