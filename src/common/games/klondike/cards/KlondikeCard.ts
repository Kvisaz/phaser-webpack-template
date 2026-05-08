import { CardSide, CardView } from "../../cards-abstract";
import { CardSuit, CardValue } from "../../cards-classic";
import { IKlondikeCard } from "../types";

export type KlondikeCardImage = Phaser.GameObjects.Image | Phaser.GameObjects.Container;

interface IProps {
  scene: Phaser.Scene;
  value: CardValue;
  suit: CardSuit;
  scale?: number;
  initStackId: string;
  initSide?: CardSide;
  faceImage: KlondikeCardImage;
  backImage: KlondikeCardImage;
}

export class KlondikeCard extends CardView implements IKlondikeCard {
  public readonly value: CardValue;
  public readonly suit: CardSuit;
  public readonly type = "KlondikeCard";

  constructor({ suit, value, scale, ...props }: IProps) {
    super(props);
    this.suit = suit;
    this.value = value;
    if (scale) {
      this.setScale(scale);
    }
  }
}

/** Type guard: проверяет, что объект — KlondikeCard */
export function isKlondikeCard(obj: unknown): obj is KlondikeCard {
  return !!obj && typeof obj === "object" && "type" in obj && (obj as { type?: unknown }).type === "KlondikeCard";
}

/** Assert guard: бросит типовую ошибку, если это не KlondikeCard */
export function assertKlondikeCard(obj: unknown): asserts obj is KlondikeCard {
  if (!isKlondikeCard(obj)) {
    throw new Error("Expected KlondikeCard");
  }
}

export function ifKlondikeCard(obj: unknown): IKlondikeCard | undefined {
  if (isKlondikeCard(obj)) return obj;
}

//
// // Пример использования:
//
// function attachToStack(maybeCard: unknown, stack: IKlondikeStack) {
//   assertKlondikeCard(maybeCard); // после этого maybeCard: KlondikeCard
//   maybeCard.stack = stack;
// }
