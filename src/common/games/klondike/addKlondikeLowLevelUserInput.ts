import { IKlondikeUserLowLevelInput } from "./types";
import { EmitterOnly, IKlondikeCard, IKlondikeStack, IKlondikeStackMap } from "../../index";
import { DragDrop } from "../../drag-drop";

interface IAddInputProps {
  cardViews: IKlondikeCard[];
  stackMap: IKlondikeStackMap;
  userInputEvents: EmitterOnly<IKlondikeUserLowLevelInput>;
  detectHoverWhileDragging?: boolean;

  isDraggable(clickedCard: IKlondikeCard): boolean;

  isDroppable(card: IKlondikeCard, dropZone: IKlondikeStack): boolean;

  getPileMovableCards(clickedCard: IKlondikeCard): IKlondikeCard[];
}

/**
 * максимально тонкий обработчик ввода игрока на карты и только карты, от которого все идет.
 * По сути слой между движком и остальной логикой.
 * описывается и реализуется для конкретной игры
 **/
export function addKlondikeLowLevelUserInput({
  cardViews,
  stackMap,
  isDroppable,
  isDraggable,
  getPileMovableCards,
  userInputEvents,
}: IAddInputProps) {
  /** add deck input **/
  stackMap.deck.cardPlace.setInteractive({ useHandCursor: true });
  stackMap.deck.cardPlace.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    userInputEvents.emit("onDeckClick", { deck: stackMap.deck });
  });

  /** add draggingCards input **/
  cardViews.forEach((card) => {
    card.setInteractive({ useHandCursor: true });
  });

  new DragDrop({
    draggables: cardViews,
    dropZones: stackMap.all,
    isDraggable: (draggable) => isDraggable(draggable as IKlondikeCard),
    isDroppable: (draggable, dropZone) =>
      isDroppable(draggable as IKlondikeCard, dropZone as IKlondikeStack),
    getDraggableGroup: (draggable) => getPileMovableCards(draggable as IKlondikeCard),
    onDrop: (args) => {
      const cards = args.draggingObjects as IKlondikeCard[];
      const toStack = args.dropZone as IKlondikeStack;
      userInputEvents.emit("onCardDrop", {
        cards,
        toStack,
      });
    },
    onDragObjectPointerUp: (dragObject) => {
      userInputEvents.emit("onCardClick", { card: dragObject as IKlondikeCard });
    },
  });
}
