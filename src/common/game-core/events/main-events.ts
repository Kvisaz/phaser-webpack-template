import { Scenes } from "../scenesNames";
import { TypedEventsEmitter } from "../../events";

export interface IGameCoreRouteEvents {
  goScene: { scene: Scenes, closeCurrent?: boolean, pauseCurrent?: boolean };
  onButtonClick: { buttonId: string };
  onButtonHover: { buttonId: string };
}

export const gameCoreMainEvents = new TypedEventsEmitter<IGameCoreRouteEvents>();
