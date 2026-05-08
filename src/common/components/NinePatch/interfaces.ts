export interface INinePatchConfig {
  scene: Phaser.Scene;
  /**
   *   true - make tiles, more resources and time, needed for repeatable pictures
   *   false - stretch, less resources and time, usefule for monotone pictures, lines etc
   */
  isTiled?: boolean;
  texture: string; // texture key
  frame: string; // custom frame is needed (optional)
  zoom: number; // zoom
  width: number; // common width
  height: number; // common height
  left: number; // padding
  right: number; // padding
  top: number; // padding
  bottom: number; // padding
}

export interface INinePatchPropsWithoutScene extends Partial<INinePatchConfig> {
  texture: string;
  left: number; // padding
  right: number; // padding
  top: number; // padding
  bottom: number; // padding
}

/**
 * Nine Patch use top, left, right, bottom
 * for 9-slice cutting of texture
 */
export interface INinePatchProps extends INinePatchPropsWithoutScene {
  scene: Phaser.Scene;
  zoom: number;
  width: number;
  height: number;
  texture: string;
  left: number; // padding
  right: number; // padding
  top: number; // padding
  bottom: number; // padding
}

export interface Column {
  srcWidth: number;
  destWidth: number;
}

export interface Row {
  srcHeight: number;
  destHeight: number;
}

/**
 * Такое расширение нужно
 * чтобы получить нормальный доступ к frames
 * и типу получаемых Frame
 */
export interface PhaserTextureExtended extends Phaser.Textures.Texture {
  frames: Record<string, Phaser.Textures.Frame>;
}
