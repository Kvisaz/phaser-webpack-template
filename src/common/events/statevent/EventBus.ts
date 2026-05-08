import { StateEvent } from "./StateEvent";

export interface Command {
  type: string;
}

export class EventBus extends StateEvent<Command> {}
