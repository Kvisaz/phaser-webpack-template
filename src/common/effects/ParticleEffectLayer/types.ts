export interface IParticleEffectAsset {
    url: string;
    frameName: string;
}

export interface IParticleEffectPoint {
    x: number;
    y: number;
}

export interface IParticleEffectArea {
    x: number;
    y: number;
    width: number;
}

export interface IParticleEffectRange {
    min: number;
    max: number;
}

export interface IParticleEffectScale {
    start: number;
    end: number;
}

export interface IParticleEffectSetConfig {
    assets: IParticleEffectAsset[];
}

export interface IParticleEffectAtlasConfig {
    name: string;
    pngUrl: string;
    jsonUrl: string;
}

export interface IParticleEffectEmitterConfig {
    emitArea: IParticleEffectArea;
    reserve: number;
    maxAliveParticles: number;
    frequency: number;
    quantity: number;
    lifespan: IParticleEffectRange;
    angle?: IParticleEffectRange;
    speed?: IParticleEffectRange;
    speedX: IParticleEffectRange;
    speedY: IParticleEffectRange;
    gravityY: number;
    scale: IParticleEffectScale;
    rotate: IParticleEffectRange;
    alpha: IParticleEffectScale;
    tint?: number[];
}

export interface IParticleEffectEmitterConfigInput {
    base?: string;
    emitArea?: Partial<IParticleEffectArea>;
    reserve?: number;
    maxAliveParticles?: number;
    frequency?: number;
    quantity?: number;
    lifespan?: Partial<IParticleEffectRange>;
    angle?: Partial<IParticleEffectRange>;
    speed?: Partial<IParticleEffectRange>;
    speedX?: Partial<IParticleEffectRange>;
    speedY?: Partial<IParticleEffectRange>;
    gravityY?: number;
    scale?: Partial<IParticleEffectScale>;
    rotate?: Partial<IParticleEffectRange>;
    alpha?: Partial<IParticleEffectScale>;
    tint?: number[];
    disableTint?: boolean;
}

export interface IParticleEffectEmitterPayload extends IParticleEffectEmitterConfigInput {
    origin?: IParticleEffectPoint;
    centerX?: number;
    width?: number;
    repeatIntervalMs?: number;
    startDelayMs?: number;
}

export interface IStartParticleEffectPayload extends IParticleEffectEmitterPayload {
    particleSet: IParticleEffectSetConfig;
    presetName?: string;
    durationMs?: number;
    emitters?: IParticleEffectEmitterPayload[];
    cascadeOverrides?: IParticleEffectCascadeOverrideRegistry;
}

export type ParticleEffectPresetEmitterConfig = IParticleEffectEmitterConfig
    | (IParticleEffectEmitterConfigInput & { base: string });

export type ParticleEffectCascadeActionType = "followEmitter" | "explodeEmitter";

export interface IParticleEffectCascadeActionConfig {
    id?: string;
    type: ParticleEffectCascadeActionType;
    chance?: number;
    destroyDelayMs?: number;
    emitter: ParticleEffectPresetEmitterConfig;
}

export interface IParticleEffectCascadeConfig {
    root: ParticleEffectPresetEmitterConfig;
    onEmit?: IParticleEffectCascadeActionConfig[];
    onDeath?: IParticleEffectCascadeActionConfig[];
}

export interface IParticleEffectCascadeOverrideRegistry {
    [actionId: string]: IParticleEffectEmitterConfigInput;
}

export interface IParticleEffectPresetConfig {
    emitters?: ParticleEffectPresetEmitterConfig[];
    cascade?: IParticleEffectCascadeConfig;
}

export interface IParticleEffectPresetRegistry {
    [presetName: string]: IParticleEffectPresetConfig;
}

export interface IParticleEffectLayerConfig {
    depth: number;
    defaultPresetName: string;
    presets: IParticleEffectPresetRegistry;
}

export interface IParticleEffectLayerConfigInput {
    depth?: number;
    defaultPresetName?: string;
    defaultPresetOptions?: IParticleEffectEmitterConfigInput;
    presets?: IParticleEffectPresetRegistry;
}

export interface IParticleEffectLayerProps {
    scene: Phaser.Scene;
    config?: IParticleEffectLayerConfigInput;
}
