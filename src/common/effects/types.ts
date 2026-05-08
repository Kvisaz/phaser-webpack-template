export interface IEffectPoint {
  x: number;
  y: number;
}

export interface IImageEffectAsset {
  url: string;
  frameName?: string;
}

export interface IImageBurstEffectConfig {
  amount?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleMultiplier?: number;
  speedMin?: number;
  speedMax?: number;
  gravity?: number;
  duration?: number;
  fadeStartK?: number;
  angleStart?: number;
  angleEnd?: number;
}

export interface IImageFlyEffectConfig {
  amount: number;
  scaleMin: number;
  scaleMax: number;
  burstDistance: number;
  burstDuration: number;
  flyStepMs: number;
  flyDurationMin: number;
  flyDurationMax: number;
  arcHeightMin: number;
  arcHeightMax: number;
  arcHeightK: number;
}

export interface IFloatingTextEffectConfig {
  text: string;
  startPoint: IEffectPoint;
  style: Phaser.Types.GameObjects.Text.TextStyle;
  velocityX: number;
  velocityY: number;
  duration: number;
  scaleFrom: number;
  scaleTo: number;
}
