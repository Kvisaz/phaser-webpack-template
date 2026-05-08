import { AlignObject, IBoundable } from "@kvisaz/phaser-sugar";
import { ArrangeOrder, arrangeOrder, findSimpleMaxOverlap } from "../gameObjects";

export type DragObject = Phaser.GameObjects.GameObject & AlignObject;
export type DropZone = IBoundable;

export interface IDragDropProps {
  draggables: DragObject[];
  dropZones: DropZone[];

  isDraggable(draggable: DragObject): boolean;

  /** должен учитывать что мы не "дропаем" на стартовую зону **/
  isDroppable(draggable: DragObject, dropZone: DropZone): boolean;

  /** какие объекты перетаскиваем **/
  getDraggableGroup?: (draggable: DragObject) => DragObject[];

  onDragStart?: (draggables: DragObject[]) => void;
  onDragEnd?: (draggables: DragObject[]) => void;
  onDrop: (args: {
    draggingObjects: DragObject[];
    dropZone: DropZone | undefined;
    success: boolean;
  }) => void;

  /** обработка клика на объекте как pointer-up
   * - если не было драггинга вообще - то есть isDraggable false
   * - все остальные кейсы включая минимальный threshold - onDrop с success  false
   * **/
  onDragObjectPointerUp?: (dragObject: DragObject) => void;
  onDropZoneHover?: (draggingObjects: DragObject[], dropZone: DropZone) => void;

  options?: IDragDropOptions;
}

export interface IDragDropOptions {
  disableBringToTopForDragging?: boolean;
  /** минимальное расстояние для драггинга **/
  dragThreshold?: number;
}

export interface DragDropState {
  /** карта с котрой все началось **/
  clickedObject: DragObject;
  /** полный перетаскиваемый пак - clickedCard может потащить несколько  **/
  draggingObjects: DragObject[];
  offsets: Map<DragObject, { x: number; y: number }>;
  startPositions: Map<DragObject, { x: number; y: number }>;
}

export class DragDrop {
  private dragState: DragDropState | null = null;

  constructor(private props: IDragDropProps) {
    const { scene } = this;
    if (scene == null) {
      console.warn("scene == null");
      return;
    }

    props.draggables.forEach((draggable) => {
      draggable.on(Phaser.Input.Events.GAMEOBJECT_DRAG_START, () => this.onDragStart(draggable));
      draggable.on(Phaser.Input.Events.GAMEOBJECT_DRAG, this.onDrag.bind(this));
      draggable.on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, () =>
        this.onCardDragEndOrPointerUp(draggable),
      );
      scene.input.setDraggable(draggable, true);
    });
  }

  get scene(): Phaser.Scene | undefined {
    return this.props.draggables[0].scene;
  }

  /** drag start == pointer down **/
  private onDragStart(clickedObject: DragObject) {
    const { isDraggable, getDraggableGroup, options } = this.props;
    if (!isDraggable(clickedObject)) return;

    /** карты компаньоны - перетаскиваются вместе, валидны только для PILE **/
    const draggingObjects = getDraggableGroup?.(clickedObject) ?? [clickedObject];

    /** ничего не тащится по причине каких-то проверок **/
    if (draggingObjects.length === 0) return;

    /** официально объявляем запуск драггинга **/
    this.props.onDragStart?.(draggingObjects);

    const offsets = new Map<DragObject, { x: number; y: number }>();
    const startPositions = new Map<DragObject, { x: number; y: number }>();

    draggingObjects.forEach((ddo) => {
      offsets.set(ddo, {
        x: ddo.x - clickedObject.x,
        y: ddo.y - clickedObject.y,
      });
      startPositions.set(ddo, { x: ddo.x, y: ddo.y });

      /** поднимаем в топ при драггинге если не запрещено **/
      if (options?.disableBringToTopForDragging !== true) {
        arrangeOrder(ddo, ArrangeOrder.top);
      }
    });

    this.dragState = {
      clickedObject,
      draggingObjects,
      offsets,
      startPositions,
    };
  }

  private onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
    if (!this.dragState) return;
    const { draggingObjects, offsets, clickedObject } = this.dragState;
    const { onDropZoneHover, dropZones, isDroppable } = this.props;

    /** мove all companions **/
    draggingObjects.forEach((ddo) => {
      const offset = offsets.get(ddo);
      if (!offset) return;
      ddo.x = dragX + offset.x;
      ddo.y = dragY + offset.y;
    });

    /** если установлена опция - отслеживаем над кем двигаемся **/
    if (onDropZoneHover) {
      const dropZone = findSimpleMaxOverlap(clickedObject, dropZones, (drag, drop) =>
        isDroppable(drag as unknown as DragObject, drop),
      );
      if (dropZone) {
        onDropZoneHover(draggingObjects, dropZone);
      }
    }
  }

  private onCardDragEndOrPointerUp(dragObject: DragObject) {
    const { onDragEnd, onDrop, onDragObjectPointerUp } = this.props;
    if (this.dragState) {
      const { draggingObjects } = this.dragState;
      const dragResult = this.onCardDragEnd(this.dragState);
      onDragEnd?.(this.dragState.draggingObjects);
      if(dragResult.dragOffset===0){
        onDragObjectPointerUp?.(dragObject);
      } else {
        onDrop({ draggingObjects, dropZone: dragResult.dropZone, success: dragResult.success });
      }
      this.dragState = null;
    } else {
      /** не было дропа или не было драггинга вообще - обрабатываем как клик **/
      onDragObjectPointerUp?.(dragObject);
    }
  }

  private onCardDragEnd(dragState: DragDropState): { success: boolean; dropZone?: DropZone; dragOffset: number } {
    const { isDroppable, dropZones, options } = this.props;
    const { clickedObject } = dragState;
    const dragOffset = getSquareDragOffset(dragState);
    const threshold = options?.dragThreshold ?? 32;
    const hasMoved = dragOffset > threshold * threshold;
    if (!hasMoved) return { success: false, dragOffset };

    const dropZone = findSimpleMaxOverlap(clickedObject, dropZones, (drag, drop) =>
      isDroppable(drag as unknown as DragObject, drop),
    );

    if (dropZone === null) {
      return { success: false, dragOffset };
    }
    return { success: true, dropZone, dragOffset };
  }
}

export function getSquareDragOffset(dragState: DragDropState): number {
  const { clickedObject, startPositions } = dragState;
  const start = startPositions.get(clickedObject);
  if (!start) return 0;
  const dx = clickedObject.x - start.x;
  const dy = clickedObject.y - start.y;
  return dx * dx + dy * dy;
}
