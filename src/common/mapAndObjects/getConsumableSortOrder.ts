export type ConsumableSortType = "UNDO" | "HINT" | "MAGIC";

const SORT_ORDER: ConsumableSortType[] = ["UNDO", "HINT", "MAGIC"];

export const getConsumableSortOrder = (type: string): number =>
  SORT_ORDER.indexOf(type as ConsumableSortType);
