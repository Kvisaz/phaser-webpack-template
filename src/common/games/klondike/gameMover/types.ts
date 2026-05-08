import { KlondikeGameMove } from "../types";

export interface IKlondikeGameMover {
  run(move: KlondikeGameMove): Promise<void>;
  undo(move: KlondikeGameMove): Promise<void>;
}
