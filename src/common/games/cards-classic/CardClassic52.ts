import { deepCopy } from "../../mapAndObjects";
import { IAbstractCard } from "../cards-abstract";

export interface IClassicCardDto {
  suit: CardSuit;
  value: CardValue;
}

export enum CardSuit {
  heart = "heart.red", // red ♥
  diamond = "diamond.red", // ♢
  spade = "spade.black", //♤
  club = "club.black", // ♧
}

export function formatSuitToRu(suit: CardSuit) {
  const suitMap: Record<CardSuit, string> = {
    "heart.red": "heart.черви.красное", // ♥
    "diamond.red": "diamond.буби.красное", // ♢
    "spade.black": "spade.пики.черное", //♤
    "club.black": "club.треф.черное",
  };

  return suitMap[suit];
}

export const cardClassic52 = {
  suits: [CardSuit.heart, CardSuit.diamond, CardSuit.spade, CardSuit.club],
  values: [2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king", "ace"],
} as const;

export type CardValue = (typeof cardClassic52)["values"][number];

export const CardValueMap: Record<CardValue, number> = {
  [2]: 2,
  [3]: 3,
  [4]: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  jack: 11,
  queen: 12,
  king: 13,
  ace: 14,
};

const clubCards = cardClassic52.values.map((value) => ({ suit: CardSuit.club, value }));
const heartCards = cardClassic52.values.map((value) => ({ suit: CardSuit.heart, value }));
const diamondCards = cardClassic52.values.map((value) => ({ suit: CardSuit.diamond, value }));
const spadeCards = cardClassic52.values.map((value) => ({ suit: CardSuit.spade, value }));

export const getClassicCardsDeck = (): IClassicCardDto[] => deepCopy([...clubCards, ...heartCards, ...diamondCards, ...spadeCards]);

export type CardViewsCreator<T extends IAbstractCard> = (playCards: IClassicCardDto[]) => T[];

export const getCardClassic52Deck = () => {
  return deepCopy({
    suits: cardClassic52.suits,
    values: cardClassic52.values,
    cards: {
      club: clubCards,
      heart: heartCards,
      diamond: diamondCards,
      spade: spadeCards,
      all: [...clubCards, ...heartCards, ...diamondCards, ...spadeCards],
    },
  });
};

export function getCardLetter(value: CardValue, locale: "ru" | "en") {
  if (value === "ace") {
    if (locale === "en") return "A";
    if (locale === "ru") return "T";
  }
  if (value === "jack") {
    if (locale === "en") return "J";
    if (locale === "ru") return "B";
  }
  if (value === "queen") {
    if (locale === "en") return "Q";
    if (locale === "ru") return "D";
  }
  if (value === "king") {
    if (locale === "en") return "K";
    if (locale === "ru") return "K";
  }
  return value.toString();
}

export function isFirstCardBigger(card1: IClassicCardDto, card2: IClassicCardDto) {
  return CardValueMap[card1.value] > CardValueMap[card2.value];
}

export function cardValueSorter(card1: IClassicCardDto, card2: IClassicCardDto) {
  return CardValueMap[card1.value] - CardValueMap[card2.value];
}

export type FigureCardValue = "jack" | "queen" | "king";

export function isFigureCard(value: CardValue) {
  return value === "jack" || value === "queen" || value === "king";
}

export function isFigureOrAceCard(value: CardValue) {
  return isFigureCard(value) || value === "ace";
}

export function isNumberCard(value: CardValue) {
  return !Number.isNaN(Number(value));
}

export function isSuit(value: string) {
  return (
    value === CardSuit.heart ||
    value === CardSuit.diamond ||
    value === CardSuit.spade ||
    value === CardSuit.club
  );
}

export function isSuitRed(suit: CardSuit) {
  return suit === CardSuit.heart || suit === CardSuit.diamond;
}

export function isSuitBlack(suit: CardSuit) {
  return suit === CardSuit.club || suit === CardSuit.spade;
}
