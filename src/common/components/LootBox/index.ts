import { Align, AlignObject } from "@kvisaz/phaser-sugar";
import { GameObject } from "../../interfaces";

type ImageView = AlignObject & GameObject & { setVisible(visible: boolean ): void };

interface IProps {
  scene: Phaser.Scene;
  opened: ImageView;
  closed: ImageView;
}

export class LootBox extends Phaser.GameObjects.Container {

  get isOpened(){
    return this.props.opened.visible && !this.props.closed.visible;
  }

  constructor(private props: IProps) {
    super(props.scene);
    const { opened, closed } = props;
    new Align(closed).center(opened);
    this.add([closed, opened])
    this.props.scene.add.existing(this);
    this.close();

    /** необходимо для интерактивности **/
    const { width, height } = this.getBounds();
    this.setSize(width, height);
  }

  open(isOpen=true){
    const { opened, closed } = this.props;
    opened.setVisible(isOpen);
    closed.setVisible(!isOpen);
  }

  close(){
    this.open(false);
  }
}
