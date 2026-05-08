import { CardSuit, CardValue } from "../../../cards-classic";
import {
  themedSpiderCardSuitPrefixMap,
  themedSpiderCardValueShortNameMap,
} from "./constants";
import { ThemedSpiderCardFaceAsset, ThemedSpiderCardFaceImageMap } from "./types";

interface IResolveThemedSpiderFaceAssetProps {
  faceImageMap: ThemedSpiderCardFaceImageMap;
  suit: CardSuit;
  value: CardValue;
}

export function buildThemedSpiderFaceKey({
  suit,
  value,
}: {
  suit: CardSuit;
  value: CardValue;
}): string {
  const prefix = themedSpiderCardSuitPrefixMap[suit];
  const valueKey = String(value);
  const shortName = themedSpiderCardValueShortNameMap[valueKey] ?? valueKey;
  return `${prefix}${shortName}`;
}

export function resolveThemedSpiderFaceAsset({
  faceImageMap,
  suit,
  value,
}: IResolveThemedSpiderFaceAssetProps): ThemedSpiderCardFaceAsset {
  const map = faceImageMap as Record<string, ThemedSpiderCardFaceAsset>;
  const key = buildThemedSpiderFaceKey({ suit, value });
  const resolved = map[key];
  if (resolved != null) {
    return resolved;
  }

  const firstKey = Object.keys(map)[0];
  if (firstKey == null) {
    throw new Error("ThemedSpiderCard: empty face image map");
  }
  return map[firstKey];
}
