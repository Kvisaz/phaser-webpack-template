import { IKlondikeStack, IKlondikeStackMap } from "../types";

export class KlondikeStackMap extends Map<string, IKlondikeStack> implements IKlondikeStackMap {
  public all: IKlondikeStack[] = [];

  constructor(stacks: IKlondikeStack[]) {
    super();
    stacks.forEach(stack => this.set(stack.id, stack));
  }

  set(key: string, value: IKlondikeStack): this {
    super.set(key, value);
    this.all.push(value);
    return this;
  }

  delete(key: string): boolean {
    const result = super.delete(key);
    this.all = this.all.filter(stack => stack.id !== key);
    return result;
  }


  get deck(): IKlondikeStack {
    return this.all.find(stack => stack.type === "deck")!;
  }

  get grave(): IKlondikeStack {
    return this.all.find(stack => stack.type === "grave")!;
  }

  get piles(): IKlondikeStack[] {
    return this.all.filter(stack => stack.type === "pile");
  }

  get bases(): IKlondikeStack[] {
    return this.all.filter(stack => stack.type === "base");
  }
}
