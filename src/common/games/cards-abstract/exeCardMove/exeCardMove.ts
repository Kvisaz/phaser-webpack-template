import { exeTranslate } from "./exeTranslate";
import { exeFlip } from "./exeFlip";
import { CardMove } from "../index";

export async function exeCardMove(moveQuants: CardMove) {
  for (let i = 0; i < moveQuants.length; i++) {
    const command = moveQuants[i];
    if (command.type === "move") {
      await exeTranslate(command);
      continue;
    }
    if (command.type === "flip") {
      await exeFlip(command);
    }
  }
}
