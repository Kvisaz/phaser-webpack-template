import { Align } from "@kvisaz/phaser-sugar";
import { CardView } from "../../../cards-abstract";
import { CardSuit, CardValue } from "../../../cards-classic";
import { ISpiderCard, SpiderCardMode } from "../../types";
import {
  IThemedSpiderCardBackTheme,
  IThemedSpiderCardProps,
  ThemedSpiderCardDimmedImage,
  ThemedSpiderCardFaceImageMap,
} from "./types";
import { resolveThemedSpiderFaceAsset } from "./utils";

export class ThemedSpiderCard extends CardView implements ISpiderCard {
  public readonly type = "ThemedSpiderCard";
  public readonly value: CardValue;
  public readonly suit: CardSuit;

  private readonly faceImageObject: Phaser.GameObjects.Image;
  private readonly backImageObject: Phaser.GameObjects.Image;
  private readonly dimmedImage: ThemedSpiderCardDimmedImage;

  private mode: SpiderCardMode = "normal";
  private faceImageMap: ThemedSpiderCardFaceImageMap;

  constructor(props: IThemedSpiderCardProps) {
    const faceAsset = resolveThemedSpiderFaceAsset({
      faceImageMap: props.faceImageMap,
      suit: props.suit,
      value: props.value,
    });

    const faceImage = new Phaser.GameObjects.Image(
      props.scene,
      0,
      0,
      faceAsset.url,
      faceAsset.frameName,
    );
    const backImage = new Phaser.GameObjects.Image(
      props.scene,
      0,
      0,
      props.backTheme.textureName,
      props.backTheme.frameName,
    );

    super({
      scene: props.scene,
      initStackId: props.initStackId,
      initSide: props.initSide,
      faceImage,
      backImage,
    });

    this.value = props.value;
    this.suit = props.suit;
    this.faceImageMap = props.faceImageMap;
    this.faceImageObject = faceImage;
    this.backImageObject = backImage;
    this.dimmedImage = props.dimmedImage;

    new Align(this.faceImageObject).center(this.dimmedImage);
    this.add(this.dimmedImage);
    this.syncMode();
  }

  setMode(mode: SpiderCardMode): void {
    this.mode = mode;
    this.syncMode();
  }

  setFaceTheme(faceImageMap: ThemedSpiderCardFaceImageMap): void {
    this.faceImageMap = faceImageMap;
    const asset = resolveThemedSpiderFaceAsset({
      faceImageMap: this.faceImageMap,
      suit: this.suit,
      value: this.value,
    });
    this.faceImageObject.setTexture(asset.url, asset.frameName);
  }

  setBackTheme(backTheme: IThemedSpiderCardBackTheme): void {
    this.backImageObject.setTexture(backTheme.textureName, backTheme.frameName);
  }

  private syncMode() {
    this.dimmedImage.setVisible(this.mode === "dimmed");
  }
}
