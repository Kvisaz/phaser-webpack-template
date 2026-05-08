import { IClassicCardDto, getCardClassic52Deck, shuffleArray } from "../../index";
import { CardSuit } from "../cards-classic";
import { SpiderSuitsMode } from "./types";

interface ICreateSpiderDeckProps {
  suitsMode: SpiderSuitsMode;
  shuffle?: boolean;
}

export function createSpiderDeck({ suitsMode, shuffle }: ICreateSpiderDeckProps): IClassicCardDto[] {
  const base = getCardClassic52Deck().cards.all;
  const doubleDeck: IClassicCardDto[] = [...base, ...base];

  const mapped = doubleDeck.map(({ suit, value }) => ({
    value,
    suit: mapSuitToMode(suit, suitsMode),
  }));

  return shuffle ? shuffleArray([...mapped]) : mapped;
}

function mapSuitToMode(suit: CardSuit, suitsMode: SpiderSuitsMode): CardSuit {
  if (suitsMode === 4) return suit;
  if (suitsMode === 1) return CardSuit.spade;

  if (suit === CardSuit.diamond) return CardSuit.heart;
  if (suit === CardSuit.club) return CardSuit.spade;
  return suit;
}

