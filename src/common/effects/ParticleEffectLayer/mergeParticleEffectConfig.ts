import {DEFAULT_PARTICLE_EFFECT_AREA_WIDTH} from "./presets";
import {
    IParticleEffectEmitterConfig,
    IParticleEffectEmitterConfigInput,
    IParticleEffectEmitterPayload,
    IStartParticleEffectPayload,
} from "./types";

/** Собирает полный particle preset из дефолта и частичных опций без зависимости от размеров сцены. */
export function mergeParticleEffectConfig(
    base: IParticleEffectEmitterConfig,
    input?: IParticleEffectEmitterConfigInput | IParticleEffectEmitterPayload | IStartParticleEffectPayload,
): IParticleEffectEmitterConfig {
    const emitArea = {
        ...base.emitArea,
        ...input?.emitArea,
    };
    const width = getParticleEffectWidth(emitArea.width, input);
    const x = getParticleEffectX(emitArea.x, width, input);

    return {
        ...base,
        ...input,
        emitArea: {
            ...emitArea,
            x,
            width,
        },
        reserve: input?.reserve ?? base.reserve,
        maxAliveParticles: input?.maxAliveParticles ?? base.maxAliveParticles,
        frequency: input?.frequency ?? base.frequency,
        quantity: input?.quantity ?? base.quantity,
        lifespan: {
            ...base.lifespan,
            ...input?.lifespan,
        },
        angle: mergeOptionalRange(base.angle, input?.angle),
        speed: mergeOptionalRange(base.speed, input?.speed),
        speedX: {
            ...base.speedX,
            ...input?.speedX,
        },
        speedY: {
            ...base.speedY,
            ...input?.speedY,
        },
        gravityY: input?.gravityY ?? base.gravityY,
        scale: {
            ...base.scale,
            ...input?.scale,
        },
        rotate: {
            ...base.rotate,
            ...input?.rotate,
        },
        alpha: {
            ...base.alpha,
            ...input?.alpha,
        },
        tint: input?.disableTint ? undefined : input?.tint ?? base.tint,
    };
}

/** Возвращает ширину эмиссии из прямой опции, emitArea или дефолта эффекта. */
function getParticleEffectWidth(
    emitAreaWidth: number,
    input?: IParticleEffectEmitterConfigInput | IParticleEffectEmitterPayload | IStartParticleEffectPayload,
): number {
    const directWidth = input != null && "width" in input ? input.width : undefined;
    return directWidth ?? (emitAreaWidth > 0 ? emitAreaWidth : DEFAULT_PARTICLE_EFFECT_AREA_WIDTH);
}

/** Выравнивает область эмиссии по centerX, если событие передало центр эффекта. */
function getParticleEffectX(
    emitAreaX: number,
    width: number,
    input?: IParticleEffectEmitterConfigInput | IParticleEffectEmitterPayload | IStartParticleEffectPayload,
): number {
    const centerX = input != null && "centerX" in input ? input.centerX : undefined;

    if (centerX == null) {
        return emitAreaX;
    }

    return centerX - width / 2;
}

/** Мержит optional range так, чтобы отсутствующий range не превращался в неполный Phaser op. */
function mergeOptionalRange(
    base?: { min: number; max: number },
    input?: Partial<{ min: number; max: number }>,
): { min: number; max: number } | undefined {
    if (base == null && input == null) {
        return undefined;
    }

    return {
        min: input?.min ?? base?.min ?? 0,
        max: input?.max ?? base?.max ?? 0,
    };
}
