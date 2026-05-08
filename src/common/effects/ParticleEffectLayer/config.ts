import {IParticleEffectLayerConfig} from "./types";
import {particleEffectPresets} from "./presets";

export const PARTICLE_EFFECT_LAYER_DEPTH = 20000;

export const defaultParticleEffectLayerConfig: IParticleEffectLayerConfig = {
    depth: PARTICLE_EFFECT_LAYER_DEPTH,
    defaultPresetName: "snowfall",
    presets: particleEffectPresets,
};
