import { GenericGameMover } from "../../game-mover-core";
import { ISpiderStackMap } from "../types";
import { SpiderGameMoveExecutor } from "./SpiderGameMoveExecutor";
import { ISpiderGameMover, SpiderGameMove } from "./types";

export function provideSpiderGameMover(stackMap: ISpiderStackMap): ISpiderGameMover {
  return new GenericGameMover<SpiderGameMove>({
    /** Executor знает о stackMap, чтобы фиксировать post-flip layout в Spider-колонках. */
    executor: new SpiderGameMoveExecutor(stackMap),
  });
}
