export class HtmlRoot {
  private static _root: HTMLElement;
  static set root(root: HTMLElement) {
    this._root = root;
  }

  static get root() {
    return this._root ?? document.body;
  }

  static get canvas(){
    return this.root.querySelector("canvas");
  }
}
