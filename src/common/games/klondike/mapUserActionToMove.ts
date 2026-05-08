import { TransferFlipCardsMove } from "../cards-move";
import { IAbstractCard, ICardStack } from "../cards-abstract";
import { IKlondikeCard, IKlondikeStack, IKlondikeStackMap } from "./types";

export type UserActionCardMoveFail = {
  type: "fail";
  cards: IAbstractCard[];
  fromStack?: ICardStack;
};

export type UserActionCardMoveSuccess = TransferFlipCardsMove & {
  type: "success";
};

type Result = UserActionCardMoveFail | UserActionCardMoveSuccess;

interface IAcceptableUserActions {
  /** можно превратить в авто-ход **/
  onCardClick: { card: IKlondikeCard };
  // onDeckClick: { deck: IKlondikeStack };

  /** можно превратить в обычный ход **/
  onCardDrop: { cards: IKlondikeCard[]; toStack: IKlondikeStack | undefined };
}

interface IProps {
  cardViews: IKlondikeCard[];
  stackMap: IKlondikeStackMap;
}

export class UserActionToMoveMapper {
  constructor(protected props: IProps) {}

  /**
   * конвертор действий игрока в ходы,
   * внимание - не все действия игрока превращаются в ходы!
   * **/
  mapUserActionToMove<K extends keyof IAcceptableUserActions>(
    event: K,
    data: IAcceptableUserActions[K],
  ): Result {
    const { cardViews, stackMap } = this.props;
    switch (event) {
      case "onCardClick": {
        const { card } = data as IAcceptableUserActions["onCardClick"];

        /** to do - find automove!!! **/
        return fail([card]);
      }
      case "onCardDrop": {
        const { cards, toStack } = data as IAcceptableUserActions["onCardDrop"];
        const fromStack = stackMap.get(cards[0]?.stackId);

        if (toStack != null && fromStack != null) {
          const transferMove: TransferFlipCardsMove = {
            steps: [
              {
                type: "cardTransfer",
                cards,
                from: fromStack,
                to: toStack,
              },
            ],
          };
          return success(transferMove);
        } else {
          return fail(cards, fromStack);
        }
      }
    }

    return fail();
  }
}

function fail(cards: IKlondikeCard[] = [], fromStack?: IKlondikeStack): UserActionCardMoveFail {
  return {
    type: "fail",
    cards,
    fromStack,
  };
}

function success(move: TransferFlipCardsMove): UserActionCardMoveSuccess {
  return {
    ...move,
    type: "success",
  };
}

export function isMove(result: Result): result is UserActionCardMoveSuccess {
  return result.type === "success";
}
