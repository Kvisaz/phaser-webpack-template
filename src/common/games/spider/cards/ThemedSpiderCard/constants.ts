import { CardSuit } from "../../../cards-classic";

export const themedSpiderCardSuitPrefixMap: Record<CardSuit, string> = {
  [CardSuit.heart]: "heart",
  [CardSuit.diamond]: "diamond",
  [CardSuit.spade]: "spade",
  [CardSuit.club]: "club",
};

export const themedSpiderCardValueShortNameMap: Record<string, string> = {
  ace: "A",
  king: "K",
  queen: "Q",
  jack: "J",
};
