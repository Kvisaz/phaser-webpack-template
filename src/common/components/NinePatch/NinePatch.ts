import { Column, INinePatchConfig, INinePatchProps, PhaserTextureExtended, Row } from "./interfaces";
import { DefaultNinePatchConfig } from "./config";

/**
 *   @deprecated - используй NineSlice из Phaser
 *   NinePatch - пропорционально растягивающаяся картинка под разные размеры
 *   идеально для кнопок
 *   нарезает и растягивает 1 картинку под почти любые размеры
 *   работает и с атласами, просто создает там фреймы дополнительные
 */
export class NinePatch extends Phaser.GameObjects.RenderTexture {
  private readonly config: INinePatchConfig;
  private cols: Column[] = [];
  private rows: Row[] = [];
  private srcTexture: PhaserTextureExtended | undefined;
  private srcFrame: Phaser.Textures.Frame | undefined;

  constructor(props: INinePatchProps) {
    super(
      props.scene,
      0,
      0,
      Math.ceil(props.width * props.zoom),
      Math.ceil(props.height * props.zoom)
    );
    this.config = {
      ...DefaultNinePatchConfig,
      ...props,
    };
    this.ceilSizes();
    this.updateTexture();
  }

  /**
   * Если не округлять числа, могут возникать полоски в WebGL
   * @private
   */
  private ceilSizes() {
    const { config } = this;
    const { zoom } = config;
    config.width = Math.ceil(config.width * zoom);
    config.height = Math.ceil(config.height * zoom);
    config.top = Math.ceil(config.top * zoom);
    config.left = Math.ceil(config.left * zoom);
    config.right = Math.ceil(config.right * zoom);
    config.bottom = Math.ceil(config.bottom * zoom);
  }

  resize(width: number, height: number): this {
    if (this.width === width && this.height === height) {
      return this;
    }
    super.resize(width, height);
    if (this.config != null) {
      this.updateTexture();
    }
    return this;
  }

  public updateTexture() {
    this.setupSourceTexture();
    this.drawCells();
  }

  private setupSourceTexture() {
    const { scene, config } = this;
    this.srcTexture = scene.textures.get(
      config.texture
    ) as PhaserTextureExtended;
    this.srcFrame = this.srcTexture.get(config.frame);
    this.setupFrameSizes();
    this.makeFrames();
    this.restoreFirstFrame();
  }

  private setupFrameSizes() {
    this.setColumns();
    this.setRows();
  }

  private setColumns() {
    const { width: destCommonWidth, srcFrame } = this;
    if (srcFrame == null) return;
    const { width: srcCommonWidth } = srcFrame;
    const { left, right } = this.config;
    this.cols = [];

    this.cols[0] = {
      srcWidth: left,
      destWidth: left,
    };

    this.cols[1] = {
      // src texture must have width > 0
      srcWidth: Math.max(srcCommonWidth - left - right, 1),
      // dest texture must have width >= 0
      destWidth: Math.max(destCommonWidth - left - right, 0),
    };

    this.cols[2] = {
      srcWidth: right,
      destWidth: right,
    };
  }

  private setRows() {
    const { height: destCommonHeight, srcFrame } = this;
    if (srcFrame == null) return;
    const { height: srcCommonHeight } = srcFrame;
    const { top, bottom } = this.config;
    this.rows = [];

    this.rows[0] = {
      srcHeight: top,
      destHeight: top,
    };

    this.rows[1] = {
      // src texture must have height > 0
      srcHeight: Math.max(srcCommonHeight - top - bottom, 1),
      // dest texture must have height >= 0
      destHeight: Math.max(destCommonHeight - top - bottom, 0),
    };

    this.rows[2] = {
      srcHeight: bottom,
      destHeight: bottom,
    };
  }

  private makeFrames() {
    const { rows, cols, srcTexture, srcFrame } = this;
    if (srcFrame == null || srcTexture == null) return;
    let offsetY = srcFrame.cutY;
    for (let row = 0; row < rows.length; row++) {
      const { srcHeight: rowHeight } = rows[row];
      if (rowHeight == 0) continue;
      let offsetX = srcFrame.cutX;
      for (let col = 0; col < cols.length; col++) {
        const { srcWidth: colWidth } = cols[col];
        if (colWidth == 0) continue;
        const frameName = this.getFrameName(col, row);
        if (!srcTexture.has(frameName)) {
          srcTexture.add(frameName, 0, offsetX, offsetY, colWidth, rowHeight);
        }

        offsetX = offsetX + colWidth;
      }
      offsetY = offsetY + rowHeight;
    }
  }

  /**
   *  Если не указывать frame (а по дефолту мы не указываем)
   *  то для картинки берется firstFrame
   *  после нарезки им становится первый frame из add
   *  это надо восстановить, чтобы все, кто использует текстуру как обычно целиком
   *  не получили неверный фрейм, не получили кусочек вместо целого
   */
  private restoreFirstFrame() {
    if (this.srcTexture == null) return;
    this.srcTexture.firstFrame = this.config.frame;
  }

  private getFrameName(col: number, row: number): string {
    return `${this.config.frame}_${col}_${row}`;
  }

  /**
   * рисуем слайсы картинками
   * где надо растянуть - растягиваем масштабом
   *
   *  - TileSprite глючит в FireFox
   *  - TileSprite также в разы медленнее
   *
   *  @magic! отрисовка drawFrames глючит на MacOS если сцена запускается через start
   */
  private drawCells() {
    const { rows, cols, srcTexture, config } = this;
    if (srcTexture == null) return;

    let offsetY = 0;
    for (let row = 0; row < rows.length; row++) {
      const { destHeight: rowHeight } = rows[row];
      if (rowHeight == 0) continue;
      let offsetX = 0;
      for (let col = 0; col < cols.length; col++) {
        const { destWidth: colWidth } = cols[col];
        if (colWidth == 0) continue;
        const isTiled = (col === 1 || row === 1) && config.isTiled;
        const nextImage = isTiled
          ? this.drawTile(col, row, colWidth, rowHeight)
          : this.drawImage(col, row, colWidth, rowHeight);
        this.draw(nextImage, offsetX, offsetY);
        nextImage.destroy();

        offsetX = Math.ceil(offsetX + colWidth);
      }
      offsetY = Math.ceil(offsetY + rowHeight);
    }
  }

  private drawImage(
    col: number,
    row: number,
    colWidth: number,
    rowHeight: number
  ) {
    const { config, scene, srcTexture } = this;
    const { texture } = config;
    const frameName = this.getFrameName(col, row);
    const frame: Phaser.Textures.Frame = srcTexture!.frames[frameName];

    const scaleX = colWidth / frame.width;
    const scaleY = rowHeight / frame.height;

    const nextImage = scene.make.image({
      key: texture,
      frame: frameName,
      x: 0,
      y: 0,
    });

    nextImage.setScale(scaleX, scaleY).setOrigin(0, 0);
    return nextImage;
  }

  private drawTile(
    col: number,
    row: number,
    colWidth: number,
    rowHeight: number
  ) {
    const { config, scene } = this;
    const { texture } = config;
    const frameName = this.getFrameName(col, row);

    const nextImage = scene.make.tileSprite({
      key: texture,
      frame: frameName,
      x: 0,
      y: 0,
      width: colWidth,
      height: rowHeight,
    });

    nextImage.setOrigin(0, 0);
    return nextImage;
  }
}
