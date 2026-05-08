import { Align } from "@kvisaz/phaser-sugar";
import { CardSide, IAbstractCard } from "./abstract_types";

type Image = Phaser.GameObjects.Container | Phaser.GameObjects.Image;

interface IProps {
  scene: Phaser.Scene;
  /** состояние карты - открыто / закртоы **/
  initSide?: CardSide;
  faceImage: Image;
  backImage: Image;
  dontAddToScene?: boolean;
  initStackId: string;
}

/**
 * Простой вью без данных
 * **/
export class CardView extends Phaser.GameObjects.Container implements IAbstractCard{
  protected inputZone: Phaser.GameObjects.Zone;
  protected readonly faceImage: Image;
  protected readonly backImage: Image;

  private _side: CardSide;
  public stackId: string;

  get side(): CardSide {
    return this._side;
  }

  private set side(value: CardSide) {
    this._side = value;
  }

  get isFaceUp(): boolean {
    return this.side === "face";
  }

  constructor(props: IProps) {
    super(props.scene, 0, 0);
    const { scene } = props;

    this.stackId = props.initStackId;
    this._side = props.initSide ?? "face";
    this.faceImage = props.faceImage;
    this.backImage = props.backImage;
    const bounds = this.faceImage.getBounds();
    this.inputZone = new Phaser.GameObjects.Zone(scene, 0, 0, bounds.width, bounds.height);

    new Align()
      .anchor(this.backImage)
      .center(this.faceImage)
      .center(this.inputZone as unknown as Phaser.GameObjects.Container);
    this.add([this.backImage, this.faceImage, this.inputZone]);

    this.updateImages();

    if (!props.dontAddToScene) {
      scene.add.existing(this);
    }
    //
    // /** позволяет делать контейнеры интерактивными **/
    const myBounds = this.getBounds();
    this.setSize(myBounds.width, myBounds.height);
  }
  /** Reveal the card face */
  flip(to?: CardSide): void {
    /** то же состояние - возврат **/
    if (this.side === to) {
      return;
    }

    if (to != null) {
      this.side = to;
    } else {
      const prevState = this.side;
      this.side = prevState === "face" ? "back" : "face";
    }

    /** новое состояние **/
    this.updateImages();
  }

  /** protected card methods **/

  /** Показываем картинку согласно состоянию */
  protected updateImages(): void {
    this.faceImage.setVisible(this.side==='face');
    this.backImage.setVisible(this.side==='back');
  }
}
