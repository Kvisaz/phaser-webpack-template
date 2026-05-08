import { AlignObject } from "@kvisaz/phaser-sugar";
import { CommonDialog, ICommonDialogProps } from "./CommonDialog";

export interface IExternalTopbarDialogProps extends ICommonDialogProps {
  topBarContent: Phaser.GameObjects.GameObject & AlignObject;
}

/** Диалог общего назначения, у которого над телом есть topbar c каким-то контентом
 *. к примеру title и close button
 * **/
export class ExternalTopbarDialog extends CommonDialog {
  constructor({topBarContent, ...props}: IExternalTopbarDialogProps) {
    super(props);
    this.add(topBarContent);
    this.align.anchor(this.background).centerX(topBarContent).topTo(topBarContent)
  }
}
