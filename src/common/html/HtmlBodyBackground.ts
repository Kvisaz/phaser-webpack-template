import { HtmlRoot } from "./HtmlRoot";

interface CSSStyleDeclaration {
  backdropFilter?: string;
}

/**
 * HtmlBodyBackground
 * Универсальный менеджер фонового изображения и затемнения страницы.
 *
 * Теперь overlay — это контейнер + 4 боковые панели (top/right/bottom/left),
 * которые затемняют ТОЛЬКО область вокруг канваса, не перекрывая canvas.
 * Методы и сигнатуры сохранены.
 */
export class HtmlBodyBackground {
  /** Контейнер overlay (как и раньше — один элемент) */
  private static overlayElement: HTMLDivElement | null = null;

  /** Четыре панели окружения */
  private static sideElements:
    | Record<"top" | "right" | "bottom" | "left", HTMLDivElement>
    | null = null;


  /** Создаёт overlay-контейнер и 4 панели, если их ещё нет */
  private static ensureOverlay(): HTMLDivElement {
    if (!this.overlayElement) {
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.zIndex = "1"; // ниже Phaser canvas
      overlay.style.pointerEvents = "none";
      overlay.style.transition = "opacity 0.3s ease";
      // контейнер прозрачный (фон задаём на сторонах)
      overlay.style.background = "rgba(0, 0, 0, 0)";

      // вставляем ровно туда же, где был старый overlay — перед canvas
      HtmlRoot.root.insertBefore(overlay, HtmlRoot.canvas);
      this.overlayElement = overlay;

      // создать 4 панели
      const makeSide = () => {
        const d = document.createElement("div");
        d.style.position = "absolute"; // внутри overlay-контейнера
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

      // следим за изменениями размеров и положения канваса внутри root
      const layout = () => this.layoutSides();
      window.addEventListener("resize", layout);
      // если у root меняются размеры без ресайза окна — наблюдатель
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(layout);
        ro.observe(HtmlRoot.root);
        if(HtmlRoot.canvas) ro.observe(HtmlRoot.canvas);
        // храним ссылку, если захочешь потом добавить destroy()
        (this.overlayElement as any).__ro = ro;
      }
    }

    // при каждом обращении обновим раскладку
    this.layoutSides();
    return this.overlayElement!;
  }

  /** Раскладывает 4 панели вокруг канваса внутри overlay-контейнера */
  private static layoutSides() {
    if (!this.overlayElement || !this.sideElements) return;

    // Геометрия внутри одного offset-контекста (общий родитель HtmlRoot.root)
    const root = HtmlRoot.root as HTMLElement;
    const canvas = HtmlRoot.canvas as HTMLElement;

    const rootWidth = root.clientWidth;
    const rootHeight = root.clientHeight;

    // Положение канваса внутри root
    const canvasLeft = canvas.offsetLeft;
    const canvasTop = canvas.offsetTop;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    // Границы «дырки»
    const left = Math.max(0, canvasLeft);
    const top = Math.max(0, canvasTop);
    const right = Math.min(rootWidth, canvasLeft + canvasWidth);
    const bottom = Math.min(rootHeight, canvasTop + canvasHeight);

    const sides = this.sideElements;

    // TOP: от верха root до верхнего края canvas
    sides.top.style.left = "0";
    sides.top.style.top = "0";
    sides.top.style.width = rootWidth + "px";
    sides.top.style.height = Math.max(0, top) + "px";

    // BOTTOM: от нижнего края canvas до низа root
    sides.bottom.style.left = "0";
    sides.bottom.style.top = Math.max(0, bottom) + "px";
    sides.bottom.style.width = rootWidth + "px";
    sides.bottom.style.height = Math.max(0, rootHeight - bottom) + "px";

    // LEFT: слева от canvas по его высоте
    sides.left.style.left = "0";
    sides.left.style.top = Math.max(0, top) + "px";
    sides.left.style.width = Math.max(0, left) + "px";
    sides.left.style.height = Math.max(0, bottom - top) + "px";

    // RIGHT: справа от canvas по его высоте
    sides.right.style.left = Math.max(0, right) + "px";
    sides.right.style.top = Math.max(0, top) + "px";
    sides.right.style.width = Math.max(0, rootWidth - right) + "px";
    sides.right.style.height = Math.max(0, bottom - top) + "px";
  }

  /**
   * Устанавливает фоновое изображение для body
   * с поддержкой fallback-версии.
   */
  static setImage(url: string, fallbackUrl?: string) {
    const imageValue = fallbackUrl
      ? `url("${url}"), url("${fallbackUrl}")`
      : `url("${url}")`;

    const body = document.body;
    body.style.backgroundImage = imageValue;
    body.style.backgroundSize = fallbackUrl ? "cover, cover" : "cover";
    body.style.backgroundPosition = fallbackUrl ? "center, center" : "center";
    body.style.backgroundRepeat = fallbackUrl ? "no-repeat, no-repeat" : "no-repeat";
  }

  /**
   * Показывает затемнение фона вокруг канваса (canvas остаётся чистым).
   * @param opacity — прозрачность слоя [0..1]
   * @param withBlur — добавить ли лёгкое размытие (по умолчанию false)
   */
  static showOverlay(opacity: number = 0.5, withBlur: boolean = false) {
    const overlay = this.ensureOverlay();

    // совместимость: раньше фон задавался на overlay целиком
    // теперь фон задаём на 4 панелях; сам контейнер оставляем прозрачным
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
      // fallback на случай, если по какой-то причине стороны не создались
      overlay.style.background = `rgba(0, 0, 0, ${opacity})`;
      (overlay.style as CSSStyleDeclaration).backdropFilter = withBlur ? "blur(3px)" : "";
    }

    this.layoutSides();
  }

  /** Убирает затемнение */
  static hideOverlay() {
    // как и прежде — гасим прозрачностью
    if (!this.overlayElement) return;
    if (this.sideElements) {
      const clear = (el: HTMLDivElement) => {
        el.style.background = "rgba(0, 0, 0, 0)";
        (el.style as CSSStyleDeclaration).backdropFilter = "";
        // размеры не трогаем — они нужны для быстрого повторного включения
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
