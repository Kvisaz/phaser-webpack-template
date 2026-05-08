import { ISpiderStack, ISpiderStackMap, SpiderStackType } from "../types";

export class SpiderStackMap extends Map<string, ISpiderStack> implements ISpiderStackMap {
  public all: ISpiderStack[] = [];

  constructor(stacks: ISpiderStack[]) {
    super();
    stacks.forEach((stack) => this.set(stack.id, stack));
  }

  set(key: string, value: ISpiderStack): this {
    super.set(key, value);
    this.all.push(value);
    return this;
  }

  delete(key: string): boolean {
    const result = super.delete(key);
    this.all = this.all.filter((stack) => stack.id !== key);
    return result;
  }

  get stock(): ISpiderStack {
    return this.all.find((stack) => stack.type === SpiderStackType.STOCK)!;
  }

  get tableaus(): ISpiderStack[] {
    return this.all.filter((stack) => stack.type === SpiderStackType.TABLEAU);
  }

  get foundations(): ISpiderStack[] {
    return this.all.filter((stack) => stack.type === SpiderStackType.FOUNDATION);
  }
}

