import { CardSide } from "../../../cards-abstract";
import { CardSuit, CardValue } from "../../../cards-classic";

export interface IThemedSpiderCardFaceAsset {
  url: string;
  frameName?: string;
}

export type ThemedSpiderCardFaceImageMap = Record<string, IThemedSpiderCardFaceAsset>;
export type ThemedSpiderCardFaceAsset = IThemedSpiderCardFaceAsset;

export interface IThemedSpiderCardBackTheme {
  textureName: string;
  frameName?: string;
}

export type ThemedSpiderCardImage = Phaser.GameObjects.Image | Phaser.GameObjects.Container;
export type ThemedSpiderCardDimmedImage = ThemedSpiderCardImage | Phaser.GameObjects.Rectangle;

export interface IThemedSpiderCardProps {
  scene: Phaser.Scene;
  value: CardValue;
  suit: CardSuit;
  initStackId: string;
  initSide: CardSide;
  faceImageMap: ThemedSpiderCardFaceImageMap;
  backTheme: IThemedSpiderCardBackTheme;
  dimmedImage: ThemedSpiderCardDimmedImage;
}
