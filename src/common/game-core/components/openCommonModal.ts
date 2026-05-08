import { AlignObject } from "@kvisaz/phaser-sugar";
import { CommonModal, ICommonModalProps } from "./CommonModal";

type ChildObject = AlignObject & Phaser.GameObjects.GameObject;

export function openCommonModal(
  content: ChildObject,
  props: Omit<ICommonModalProps, "content" | "isAutoOpen"> = {},
): CommonModal {
  return new CommonModal({
    ...props,
    content,
    isAutoOpen: true,
  });
}
