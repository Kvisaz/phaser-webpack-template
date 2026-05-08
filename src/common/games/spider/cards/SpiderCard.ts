import { Align } from "@kvisaz/phaser-sugar";
import { CardSide, CardView } from "../../cards-abstract";
import { CardSuit, CardValue } from "../../cards-classic";
import { ISpiderCard, SpiderCardMode } from "../types";

export type SpiderCardImage =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Container;

export type SpiderCardDimmedImage = SpiderCardImage
  | Phaser.GameObjects.Rectangle;

interface IProps {
  scene: Phaser.Scene;
  value: CardValue;
  suit: CardSuit;
  initStackId: string;
  initSide?: CardSide;
  faceImage: SpiderCardImage;
  backImage: SpiderCardImage;
  dimmedImage?: SpiderCardDimmedImage;
}

export class SpiderCard extends CardView implements ISpiderCard {
  public readonly value: CardValue;
  public readonly suit: CardSuit;
  public readonly type = "SpiderCard";
  private readonly dimmedImage: SpiderCardDimmedImage;
  private mode: SpiderCardMode = "normal";

  constructor({ suit, value, dimmedImage, ...props }: IProps) {
    super(props);
    this.suit = suit;
    this.value = value;
    this.dimmedImage = dimmedImage ?? this.createFallbackDimmedImage(props.scene);
    new Align(this.faceImage).center(this.dimmedImage);
    this.add(this.dimmedImage);
    this.syncMode();
  }

  setMode(mode: SpiderCardMode): void {
    this.mode = mode;
    this.syncMode();
  }

  private syncMode() {
    this.dimmedImage.setVisible(this.mode === "dimmed");
  }

  private createFallbackDimmedImage(scene: Phaser.Scene): SpiderCardDimmedImage {
    const bounds = this.faceImage.getBounds();
    return new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      bounds.width,
      bounds.height,
      0x000000,
      0.35,
    );
  }
}
