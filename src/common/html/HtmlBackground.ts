/** Управляет фоном <body> с возможностью отката изменений. */
export class HtmlBackground {
  private previousValues: Partial<CSSStyleDeclaration> = {};
  private readonly url: string;
  private readonly fallbackUrl?: string;

  constructor(params: { url: string; fallbackUrl?: string }) {
    this.url = params.url;
    this.fallbackUrl = params.fallbackUrl;
    this.apply();
  }

  /** Применяет фон и запоминает старые стили. */
  private apply() {
    const bodyStyle = document.body.style;

    this.previousValues = {
      backgroundImage: bodyStyle.backgroundImage,
      backgroundSize: bodyStyle.backgroundSize,
      backgroundPosition: bodyStyle.backgroundPosition,
      backgroundRepeat: bodyStyle.backgroundRepeat,
    };

    const imageValue = this.fallbackUrl
      ? `url("${this.url}"), url("${this.fallbackUrl}")`
      : `url("${this.url}")`;

    bodyStyle.backgroundImage = imageValue;
    bodyStyle.backgroundSize = this.fallbackUrl ? "cover, cover" : "cover";
    bodyStyle.backgroundPosition = this.fallbackUrl ? "center, center" : "center";
    bodyStyle.backgroundRepeat = this.fallbackUrl
      ? "no-repeat, no-repeat"
      : "no-repeat";
  }

  /** Восстанавливает предыдущие значения и очищает ссылку. */
  public destroy() {
    const bodyStyle = document.body.style;
    for (const key in this.previousValues) {
      const value = this.previousValues[key as keyof CSSStyleDeclaration];
      if (typeof value === "string") {
        (bodyStyle as any)[key] = value;
      }
    }
    this.previousValues = {};
  }
}
