import { CardValue } from "../../cards-classic";
import { ISpiderCard, ISpiderConfig, ISpiderMagicMove, ISpiderStack, ISpiderStackMap, SpiderStackType } from "../types";
import { SpiderHintHelper } from "./SpiderHintHelper";
import { SpiderMagicHelper } from "./SpiderMagicHelper";

interface ISpiderRulesProps {
  stackMap: ISpiderStackMap;
  config: ISpiderConfig;
}

export class SpiderRules {
  private readonly valueOrder: CardValue[] = [
    "ace",
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    "jack",
    "queen",
    "king",
  ];

  private readonly hintHelper: SpiderHintHelper;
  private readonly magicHelper: SpiderMagicHelper;

  constructor(private readonly props: ISpiderRulesProps) {
    this.hintHelper = new SpiderHintHelper({
      stackMap: props.stackMap,
      getMovableChain: this.getMovableChain.bind(this),
      canMoveToTableau: this.canMoveToTableau.bind(this),
      isTableauChainable: this.isTableauChainable.bind(this),
    });
    this.magicHelper = new SpiderMagicHelper({
      stackMap: props.stackMap,
      canMoveToTableau: this.canMoveToTableau.bind(this),
      isTableauChainable: this.isTableauChainable.bind(this),
    });
  }

  isDraggable(card: ISpiderCard | undefined, dragStartZone: ISpiderStack | undefined): boolean {
    if (card == null || dragStartZone == null) return false;
    if (dragStartZone.type !== SpiderStackType.TABLEAU) return false;
    return card.isFaceUp;
  }

  isDroppable(card: ISpiderCard | undefined, dropZone: ISpiderStack | undefined): boolean {
    if (card == null || dropZone == null) return false;
    if (dropZone.type !== SpiderStackType.TABLEAU) return false;
    if (dropZone.id === card.stackId) return false;
    return this.canMoveToTableau(card, dropZone);
  }

  getMovableChain(fromCard: ISpiderCard): ISpiderCard[] {
    const { stackMap } = this.props;
    const stack = stackMap.get(fromCard.stackId);

    if (stack == null || stack.type !== SpiderStackType.TABLEAU || stack.cards.length === 0) return [];
    if (!fromCard.isFaceUp) return [];

    const { cards } = stack;
    const startIndex = cards.indexOf(fromCard);
    if (startIndex < 0) return [];

    const chain = cards.slice(startIndex);
    if (chain.length === 0) return [];

    for (let i = 0; i < chain.length - 1; i++) {
      const top = chain[i];
      const bottom = chain[i + 1];
      if (!top.isFaceUp || !bottom.isFaceUp) return [];
      if (!this.isTableauChainable(top, bottom)) return [];
    }

    return chain;
  }

  canDealFromStock(): boolean {
    const { config, stackMap } = this.props;
    if (stackMap.stock.length < stackMap.tableaus.length) return false;
    if (!config.allowDealWithEmptyTableau && stackMap.tableaus.some((t) => t.length === 0)) return false;
    return true;
  }

  getDealsLeft(): number {
    const { stackMap } = this.props;
    return Math.floor(stackMap.stock.length / stackMap.tableaus.length);
  }

  getTotalSequences(): number {
    return this.props.stackMap.foundations.length;
  }

  findCollectableSequences(): Array<{ from: ISpiderStack; cards: ISpiderCard[] }> {
    const { stackMap } = this.props;
    const result: Array<{ from: ISpiderStack; cards: ISpiderCard[] }> = [];

    stackMap.tableaus.forEach((tableau) => {
      const cards = this.getCompletedTailSequence(tableau);
      if (cards) {
        result.push({ from: tableau, cards });
      }
    });

    return result;
  }

  findHintMove(allowMeaninglessHints = true):
    | { from: ISpiderStack; to: ISpiderStack; cards: ISpiderCard[] }
    | undefined {
    return this.hintHelper.findHintMove(allowMeaninglessHints);
  }

  findMagicMove(): ISpiderMagicMove | undefined {
    return this.magicHelper.findMagicMove();
  }

  isTableauChainable(top: ISpiderCard, bottom: ISpiderCard): boolean {
    return this.cardOrder(top.value) === this.cardOrder(bottom.value) + 1;
  }

  canMoveToTableau(movingCard: ISpiderCard, tableau: ISpiderStack): boolean {
    if (tableau.topCard == null) return true;
    return this.isTableauChainable(tableau.topCard, movingCard);
  }

  getCompletedTailSequence(stack: ISpiderStack): ISpiderCard[] | undefined {
    if (stack.type !== SpiderStackType.TABLEAU) return;
    if (stack.length < 13) return;

    const tail = stack.cards.slice(-13);
    if (tail.some((c) => !c.isFaceUp)) return;

    const suit = tail[0]?.suit;
    if (suit == null) return;
    if (tail.some((c) => c.suit !== suit)) return;
    if (tail[0].value !== "king") return;
    if (tail[tail.length - 1].value !== "ace") return;

    for (let i = 0; i < tail.length - 1; i++) {
      const top = tail[i];
      const bottom = tail[i + 1];
      if (this.cardOrder(top.value) !== this.cardOrder(bottom.value) + 1) return;
    }

    return tail;
  }

  private cardOrder(value: CardValue): number {
    return this.valueOrder.indexOf(value);
  }
}
