import { HtmlRoot } from "./HtmlRoot";

interface CSSStyleDeclaration {
  backdropFilter?: string;
}

/** Управляет затемняющими панелями вокруг canvas. */
export class HtmlOverlay {
  private static overlayElement: HTMLDivElement | null = null;

  private static sideElements:
    | Record<"top" | "right" | "bottom" | "left", HTMLDivElement>
    | null = null;

  /** Создаёт overlay и боковые панели при необходимости. */
  private static ensureOverlay(): HTMLDivElement {
    if (!this.overlayElement) {
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.zIndex = "1";
      overlay.style.pointerEvents = "none";
      overlay.style.transition = "opacity 0.3s ease";
      overlay.style.background = "rgba(0, 0, 0, 0)";

      HtmlRoot.root.insertBefore(overlay, HtmlRoot.canvas);
      this.overlayElement = overlay;

      const makeSide = () => {
        const d = document.createElement("div");
        d.style.position = "absolute";
        d.style.pointerEvents = "none";
        d.style.background = "rgba(0, 0, 0, 0)";
        (d.style as CSSStyleDeclaration).backdropFilter = "";
        overlay.appendChild(d);
        return d;
      };

      this.sideElements = {
        top: makeSide(),
        right: makeSide(),
        bottom: makeSide(),
        left: makeSide(),
      };

      const layout = () => this.layoutSides();
      window.addEventListener("resize", layout);

      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(layout);
        ro.observe(HtmlRoot.root);
        if (HtmlRoot.canvas) ro.observe(HtmlRoot.canvas);
        (this.overlayElement as any).__ro = ro;
      }
    }

    this.layoutSides();
    return this.overlayElement!;
  }

  /** Раскладывает 4 панели вокруг канваса внутри overlay-контейнера. */
  private static layoutSides() {
    if (!this.overlayElement || !this.sideElements) return;

    const root = HtmlRoot.root as HTMLElement;
    const canvas = HtmlRoot.canvas as HTMLElement;

    const rootWidth = root.clientWidth;
    const rootHeight = root.clientHeight;

    const canvasLeft = canvas.offsetLeft;
    const canvasTop = canvas.offsetTop;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    const left = Math.max(0, canvasLeft);
    const top = Math.max(0, canvasTop);
    const right = Math.min(rootWidth, canvasLeft + canvasWidth);
    const bottom = Math.min(rootHeight, canvasTop + canvasHeight);

    const sides = this.sideElements;

    sides.top.style.left = "0";
    sides.top.style.top = "0";
    sides.top.style.width = rootWidth + "px";
    sides.top.style.height = Math.max(0, top) + "px";

    sides.bottom.style.left = "0";
    sides.bottom.style.top = Math.max(0, bottom) + "px";
    sides.bottom.style.width = rootWidth + "px";
    sides.bottom.style.height = Math.max(0, rootHeight - bottom) + "px";

    sides.left.style.left = "0";
    sides.left.style.top = Math.max(0, top) + "px";
    sides.left.style.width = Math.max(0, left) + "px";
    sides.left.style.height = Math.max(0, bottom - top) + "px";

    sides.right.style.left = Math.max(0, right) + "px";
    sides.right.style.top = Math.max(0, top) + "px";
    sides.right.style.width = Math.max(0, rootWidth - right) + "px";
    sides.right.style.height = Math.max(0, bottom - top) + "px";
  }

  /**
   * Показывает затемнение фона вокруг канваса (canvas остаётся чистым).
   * @param opacity — прозрачность слоя [0..1]
   * @param withBlur — добавить ли размытие
   */
  static showOverlay(opacity: number = 0.5, withBlur: boolean = false) {
    const overlay = this.ensureOverlay();
    if (this.sideElements) {
      const apply = (el: HTMLDivElement) => {
        el.style.background = `rgba(0, 0, 0, ${opacity})`;
        (el.style as CSSStyleDeclaration).backdropFilter = withBlur ? "blur(3px)" : "";
      };
      apply(this.sideElements.top);
      apply(this.sideElements.right);
      apply(this.sideElements.bottom);
      apply(this.sideElements.left);
    } else {
      overlay.style.background = `rgba(0, 0, 0, ${opacity})`;
      (overlay.style as CSSStyleDeclaration).backdropFilter = withBlur ? "blur(3px)" : "";
    }

    this.layoutSides();
  }

  /** Убирает затемнение. */
  static hideOverlay() {
    if (!this.overlayElement) return;
    if (this.sideElements) {
      const clear = (el: HTMLDivElement) => {
        el.style.background = "rgba(0, 0, 0, 0)";
        (el.style as CSSStyleDeclaration).backdropFilter = "";
      };
      clear(this.sideElements.top);
      clear(this.sideElements.right);
      clear(this.sideElements.bottom);
      clear(this.sideElements.left);
    } else {
      this.overlayElement.style.background = "rgba(0, 0, 0, 0)";
      (this.overlayElement.style as CSSStyleDeclaration).backdropFilter = "";
    }
  }
}
