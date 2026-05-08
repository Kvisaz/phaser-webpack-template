import { Align, AlignObject } from "@kvisaz/phaser-sugar";
import { ContainerButton, IButtonOptions } from "./ContainerButton";

type SwitchView = AlignObject & Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

export interface ISwitchButtonProps {
  viewOn: SwitchView;
  viewOff: SwitchView;
  isOn?: boolean;
  /** срабатывает только при клике юзера,
   * не переключается при принудительном переключении **/
  onSwitchClick: (to: boolean) => void;
  onOver?: () => void;
  onOut?: () => void;
  options?: Partial<IButtonOptions>;
}

/** SwitchButton
 * - контейнер с 2 детьми - viewOn, viewOff
 * - имеет внутреннее состояние
 * - viewOn, viewOff должны иметь одинаковые размеры
 * **/
export class SwitchButton extends ContainerButton {
  protected isOn: boolean;
  private viewOn: SwitchView;
  private viewOff: SwitchView;
  private onSwitchClick: (to: boolean) => void;

  constructor({ viewOn, viewOff, isOn, onSwitchClick, ...rest }: ISwitchButtonProps) {
    const onClick = () => {
      this.onClick();
    };
    super({ gameObjects: [viewOff, viewOn], onClick, ...rest });
    new Align(viewOn).center(viewOff);
    this.isOn = isOn === true;
    this.viewOn = viewOn;
    this.viewOff = viewOff;
    this.onSwitchClick = onSwitchClick;
    this.updateDesign();
    this.updateInteractiveZone();
  }

  switch(to: boolean) {
    if (to === this.isOn) return;
    this.isOn = to;
    this.updateDesign();
  }

  protected onClick() {
    const newState = !this.isOn;
    this.switch(newState);
    this.onSwitchClick(newState);
  }

  protected updateDesign() {
    this.viewOn.setVisible(this.isOn);
    this.viewOff.setVisible(!this.isOn);
  }

  /** disable over effect **/
  protected addOverEffect() {
    if (this.isOverEffect) return;
    this.isOverEffect = true;
    // this.background.postFX?.addGlow?.();
  }

  protected clearOverEffect() {
    if (!this.isOverEffect) return;
    this.isOverEffect = false;
    // this.background.postFX?.clear?.();
  }
}
