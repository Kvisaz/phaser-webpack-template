interface IBackgroundLayer {
  backgroundCss?: string;
  url?: string;
  fallbackUrl?: string;
  defaultUrl?: string;
  opacity?: number;
}

interface IProps {
  layers: IBackgroundLayer[];
}

interface IBodyStyleSnapshot {
  background: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  position: string;
  zIndex: string;
}

export class HtmlLayeredBackground {
  private readonly bodyStyleSnapshot: IBodyStyleSnapshot;
  private readonly overlayElement?: HTMLDivElement;

  /** Первый слой рисуем на body, второй - отдельным fullscreen-слоем. */
  constructor({ layers }: IProps) {
    this.bodyStyleSnapshot = this.snapshotBodyStyle();
    this.applyBodyLayer(layers[0]);

    if (layers[1] != null) {
      this.overlayElement = document.createElement("div");
      this.overlayElement.style.position = "fixed";
      this.overlayElement.style.inset = "0";
      this.overlayElement.style.pointerEvents = "none";
      this.overlayElement.style.zIndex = "-1";
      document.body.appendChild(this.overlayElement);
      this.applyOverlayLayer(layers[1]);
    }
  }

  /** Возвращаем body в прежнее состояние и убираем свой fixed-слой. */
  destroy() {
    this.overlayElement?.remove();
    this.applyBodyStyle(this.bodyStyleSnapshot);
  }

  /** Фиксируем только то, что реально меняем. */
  private snapshotBodyStyle() {
    const bodyStyle = document.body.style;
    return {
      background: bodyStyle.background,
      backgroundImage: bodyStyle.backgroundImage,
      backgroundSize: bodyStyle.backgroundSize,
      backgroundPosition: bodyStyle.backgroundPosition,
      backgroundRepeat: bodyStyle.backgroundRepeat,
      position: bodyStyle.position,
      zIndex: bodyStyle.zIndex,
    };
  }

  /** Применяем снапшот body-style целиком, чтобы не дублировать присваивания. */
  private applyBodyStyle(snapshot: IBodyStyleSnapshot) {
    const bodyStyle = document.body.style;
    bodyStyle.background = snapshot.background;
    bodyStyle.backgroundImage = snapshot.backgroundImage;
    bodyStyle.backgroundSize = snapshot.backgroundSize;
    bodyStyle.backgroundPosition = snapshot.backgroundPosition;
    bodyStyle.backgroundRepeat = snapshot.backgroundRepeat;
    bodyStyle.position = snapshot.position;
    bodyStyle.zIndex = snapshot.zIndex;
  }

  /** Базовый слой живет на body и не зависит от размеров canvas. */
  private applyBodyLayer(config?: IBackgroundLayer) {
    if (config == null) {
      return;
    }

    const bodyStyle = document.body.style;
    bodyStyle.position = "relative";
    bodyStyle.zIndex = "0";

    if (config.backgroundCss != null) {
      bodyStyle.background = config.backgroundCss;
      return;
    }

    if (config.url == null) {
      return;
    }

    const imageUrls = [config.url, config.fallbackUrl, config.defaultUrl].filter(
      (url): url is string => url != null,
    );
    const imageValue = imageUrls.map((url) => `url("${url}")`).join(", ");

    bodyStyle.backgroundImage = imageValue;
    bodyStyle.backgroundSize = imageUrls.map(() => "cover").join(", ");
    bodyStyle.backgroundPosition = imageUrls.map(() => "center").join(", ");
    bodyStyle.backgroundRepeat = imageUrls.map(() => "no-repeat").join(", ");
  }

  /** Оверлейный слой отдельно управляет прозрачностью картинки. */
  private applyOverlayLayer(config: IBackgroundLayer) {
    if (this.overlayElement == null) {
      return;
    }

    if (config.backgroundCss != null) {
      this.overlayElement.style.background = config.backgroundCss;
      return;
    }

    if (config.url == null) {
      return;
    }

    const imageUrls = [config.url, config.fallbackUrl, config.defaultUrl].filter(
      (url): url is string => url != null,
    );
    const imageValue = imageUrls.map((url) => `url("${url}")`).join(", ");

    this.overlayElement.style.backgroundImage = imageValue;
    this.overlayElement.style.backgroundSize = imageUrls.map(() => "cover").join(", ");
    this.overlayElement.style.backgroundPosition = imageUrls.map(() => "center").join(", ");
    this.overlayElement.style.backgroundRepeat = imageUrls.map(() => "no-repeat").join(", ");
    this.overlayElement.style.opacity = config.opacity == null ? "1" : String(config.opacity);
  }
}
