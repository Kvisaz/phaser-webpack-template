export class Stack<T> {
  public items: T[] = [];

  constructor(initial: T[] = []) {
    this.items = initial;
  }

  push(item: T) {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    this.items.length = 0;
  }

  size() {
    return this.items.length;
  }

  /** Перекладывает все элементы в другой стек,
   * сохраняя правильный порядок (верх к верху) */
  moveAllTo(target: Stack<T>) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      target.push(this.items[i]);
    }
    this.clear();
  }
}
