import {SceneEvents} from "../../events";
import {defaultParticleEffectLayerConfig} from "./config";
import {mergeParticleEffectConfig} from "./mergeParticleEffectConfig";
import {
    IParticleEffectCascadeActionConfig,
    IParticleEffectCascadeConfig,
    IParticleEffectEmitterConfig,
    IParticleEffectEmitterPayload,
    IParticleEffectLayerConfig,
    IParticleEffectLayerProps,
    ParticleEffectPresetEmitterConfig,
    IStartParticleEffectPayload,
} from "./types";

type ParticleEmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

interface IResolvedParticleCascadeActionConfig {
    id?: string;
    type: IParticleEffectCascadeActionConfig["type"];
    chance?: number;
    destroyDelayMs?: number;
    emitter: IParticleEffectEmitterConfig;
}

interface IParticleEffectLayerEvents {
    startParticleEffect: IStartParticleEffectPayload;
    stopParticleEffect: void;
}

const DEFAULT_CASCADE_ACTION_CHANCE = 1;
const DEFAULT_CASCADE_CHILD_DESTROY_DELAY_MS = 1000;

/**
 * Сценовый слой абстрактных particle-эффектов поверх UI, диалогов и overlay.
 **/
export class ParticleEffectLayer extends Phaser.GameObjects.Zone {
    private readonly unSubs: Array<() => void> = [];
    private readonly config: IParticleEffectLayerConfig;
    private readonly activeEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private readonly stopTimers: Phaser.Time.TimerEvent[] = [];
    private readonly unSubEmitterSceneShutdowns: Array<() => void> = [];
    private readonly followEmittersByParticle = new Map<
        Phaser.GameObjects.Particles.Particle,
        Phaser.GameObjects.Particles.ParticleEmitter[]
    >();
    private readonly childDestroyDelayByEmitter = new Map<Phaser.GameObjects.Particles.ParticleEmitter, number>();

    /** Создает слой, подписывает его на модульный event и готовит дефолтные пресеты движения. */
    constructor(private readonly props: IParticleEffectLayerProps) {
        super(props.scene, 0, 0);

        this.config = this.createConfig(props);

        const sceneEvents = new SceneEvents<IParticleEffectLayerEvents>({
            scene: props.scene,
            autoUnSub: this,
        });
        this.unSubs.push(sceneEvents.on("startParticleEffect", (data) => this.startParticleEffect(data)));
        this.unSubs.push(sceneEvents.on("stopParticleEffect", () => this.stopParticleEffect()));

        props.scene.add.existing(this);
        this.setDepth(this.config.depth);
        this.bringLayerToTop();
    }

    /** Очищает подписки, таймер и активный Phaser emitter при уничтожении слоя. */
    destroy(fromScene?: boolean): void {
        this.unSubs.forEach((unSub) => unSub());
        this.unSubs.length = 0;
        this.stopParticleEffect();
        super.destroy(fromScene);
    }

    /** Запускает обычный список emitter-ов или cascade-цепочку, если выбранный preset ее описывает. */
    private startParticleEffect(data: IStartParticleEffectPayload): void {
        this.stopParticleEffect();
        this.bringLayerToTop();

        if (data.particleSet.assets.length === 0) {
            return;
        }

        const textureName = this.getTextureName(data);
        const emitterScene = this.getEmitterScene();
        const cascade = this.getCascadeConfig(data);

        if (cascade != null) {
            this.startParticleCascade({
                emitterScene,
                textureName,
                data,
                cascade,
            });
            return;
        }

        const emitterPayloads = this.createEmitterPayloads(data);
        emitterPayloads.forEach((payload) => {
            this.createEmitter({
                emitterScene,
                textureName,
                data,
                payload,
            });
        });
    }

    /** Останавливает все emitter-ы слоя: обычные, root и дочерние cascade-emitter-ы. */
    private stopParticleEffect(): void {
        this.stopTimers.forEach((timer) => timer.remove(false));
        this.stopTimers.length = 0;
        this.unSubEmitterSceneShutdowns.forEach((unSub) => unSub());
        this.unSubEmitterSceneShutdowns.length = 0;
        this.followEmittersByParticle.clear();
        this.childDestroyDelayByEmitter.clear();
        this.activeEmitters.forEach((emitter) => emitter.destroy());
        this.activeEmitters.length = 0;
    }

    /** Собирает конфиг слоя из дефолтов и опциональных props без внешних зависимостей. */
    private createConfig(props: IParticleEffectLayerProps): IParticleEffectLayerConfig {
        const defaultPresetName = props.config?.defaultPresetName
            ?? defaultParticleEffectLayerConfig.defaultPresetName;
        const presets = {
            ...defaultParticleEffectLayerConfig.presets,
            ...props.config?.presets,
        };

        return {
            depth: props.config?.depth ?? defaultParticleEffectLayerConfig.depth,
            defaultPresetName,
            presets,
        };
    }

    /** Превращает payload события в Phaser ParticleEmitterConfig с расширяемыми optional-полями. */
    private createParticleEmitterConfig(
        data: IParticleEffectEmitterPayload,
        eventPayload: IStartParticleEffectPayload,
    ): ParticleEmitterConfig {
        const particleEffect = this.createEmitterConfig(data);
        const velocityConfig = this.createVelocityEmitterConfig(particleEffect);

        return {
            frame: eventPayload.particleSet.assets.map((asset) => asset.frameName),
            lifespan: particleEffect.lifespan,
            ...velocityConfig,
            gravityY: particleEffect.gravityY,
            reserve: particleEffect.reserve,
            maxAliveParticles: particleEffect.maxAliveParticles,
            scale: particleEffect.scale,
            rotate: particleEffect.rotate,
            alpha: particleEffect.alpha,
            tint: particleEffect.tint,
            frequency: particleEffect.frequency,
            quantity: particleEffect.quantity,
            x: {
                min: particleEffect.emitArea.x,
                max: particleEffect.emitArea.x + particleEffect.emitArea.width,
            },
            y: particleEffect.emitArea.y,
            emitting: particleEffect.frequency !== -1,
        };
    }

    /** Выбирает один режим скорости: радиальный angle/speed или независимые speedX/speedY для потоков. */
    private createVelocityEmitterConfig(
        config: IParticleEffectEmitterConfig,
    ): Pick<ParticleEmitterConfig, "angle" | "speed" | "speedX" | "speedY"> {
        if (config.angle != null && config.speed != null) {
            return {
                angle: config.angle,
                speed: config.speed,
            };
        }

        return {
            speedX: config.speedX,
            speedY: config.speedY,
        };
    }

    /** Раскрывает preset события в список emitter payload с координатами и локальными overrides. */
    private createEmitterPayloads(data: IStartParticleEffectPayload): IParticleEffectEmitterPayload[] {
        const presetName = data.presetName ?? this.config.defaultPresetName;
        const preset = this.config.presets[presetName] ?? this.config.presets[this.config.defaultPresetName];
        const presetEmitters = preset.emitters ?? this.config.presets[this.config.defaultPresetName].emitters ?? [];
        const sharedPayload = this.createSharedEmitterPayload(data);

        if (data.emitters != null) {
            return data.emitters.map((emitter, index) => ({
                ...(presetEmitters[index] ?? {}),
                ...sharedPayload,
                ...emitter,
            }));
        }

        return presetEmitters.map((emitter) => ({
            ...emitter,
            ...sharedPayload,
        }));
    }

    /** Отделяет общие emitter-настройки события от служебных полей preset-а и списка emitter-ов. */
    private createSharedEmitterPayload(data: IStartParticleEffectPayload): IParticleEffectEmitterPayload {
        return {
            base: data.base,
            emitArea: data.emitArea,
            reserve: data.reserve,
            maxAliveParticles: data.maxAliveParticles,
            frequency: data.frequency,
            quantity: data.quantity,
            lifespan: data.lifespan,
            angle: data.angle,
            speed: data.speed,
            speedX: data.speedX,
            speedY: data.speedY,
            gravityY: data.gravityY,
            scale: data.scale,
            rotate: data.rotate,
            alpha: data.alpha,
            tint: data.tint,
            disableTint: data.disableTint,
            origin: data.origin,
            centerX: data.centerX,
            width: data.width,
            repeatIntervalMs: data.repeatIntervalMs,
            startDelayMs: data.startDelayMs,
        };
    }

    /** Берет emitter base из реестра и накладывает на него опции конкретного запуска. */
    private createEmitterConfig(data: IParticleEffectEmitterPayload): IParticleEffectEmitterConfig {
        const baseName = data.base ?? this.config.defaultPresetName;
        const baseEmitter = this.resolveBaseEmitterConfig(baseName);
        return mergeParticleEffectConfig(baseEmitter, data);
    }

    /** Рекурсивно раскрывает base-emitter до полного конфига Phaser emitter-а. */
    private resolveBaseEmitterConfig(presetName: string): IParticleEffectEmitterConfig {
        const preset = this.config.presets[presetName] ?? this.config.presets[this.config.defaultPresetName];
        const emitter = preset.emitters?.[0];

        if (emitter == null) {
            throw new Error(`ParticleEffect preset "${presetName}" has no base emitter config`);
        }

        if ("base" in emitter && emitter.base != null) {
            return mergeParticleEffectConfig(this.resolveBaseEmitterConfig(emitter.base), emitter);
        }

        return emitter as IParticleEffectEmitterConfig;
    }

    /** Возвращает cascade-пресет, если выбранный preset описывает цепочку emitter-ов. */
    private getCascadeConfig(data: IStartParticleEffectPayload): IParticleEffectCascadeConfig | undefined {
        const presetName = data.presetName ?? this.config.defaultPresetName;
        const preset = this.config.presets[presetName] ?? this.config.presets[this.config.defaultPresetName];
        return preset.cascade;
    }

    /**
     * Запускает цепочку emitter-ов внутри единой механики ParticleEffectLayer.
     *
     * Root emitter создается так же, как обычный emitter, но получает lifecycle callbacks.
     * `emitCallback` обрабатывает действия вида followEmitter, `deathCallback` - explodeEmitter.
     * Все дочерние emitter-ы регистрируются через `registerEmitter`, поэтому cleanup остается единым.
     */
    private startParticleCascade(props: {
        emitterScene: Phaser.Scene;
        textureName: string;
        data: IStartParticleEffectPayload;
        cascade: IParticleEffectCascadeConfig;
    }): void {
        const rootConfig = mergeParticleEffectConfig(
            this.resolvePresetEmitterConfig(props.cascade.root),
            this.createSharedEmitterPayload(props.data),
        );
        const rootEmitterConfig = this.createParticleEmitterConfigFromResolved(
            rootConfig,
            props.data,
        );
        const onEmit = this.createCascadeActionConfigs(props.cascade.onEmit ?? [], props.data);
        const onDeath = this.createCascadeActionConfigs(props.cascade.onDeath ?? [], props.data);
        const origin = props.data.origin ?? this.getDefaultOrigin();
        const rootEmitter = props.emitterScene.add.particles(origin.x, origin.y, props.textureName, {
            ...rootEmitterConfig,
            emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                this.runCascadeEmitActions({
                    emitterScene: props.emitterScene,
                    textureName: props.textureName,
                    data: props.data,
                    rootEmitter,
                    particle,
                    actions: onEmit,
                });
            },
            deathCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                this.runCascadeDeathActions({
                    emitterScene: props.emitterScene,
                    textureName: props.textureName,
                    data: props.data,
                    particle,
                    actions: onDeath,
                });
            },
            emitting: true,
        });
        this.registerEmitter(props.emitterScene, rootEmitter);

        if (props.data.durationMs == null) {
            return;
        }

        this.stopTimers.push(props.emitterScene.time.delayedCall(props.data.durationMs, () => {
            this.destroyEmitter(rootEmitter);
        }));
    }

    /** Превращает полный emitter config в Phaser config без повторного поиска base. */
    private createParticleEmitterConfigFromResolved(
        particleEffect: IParticleEffectEmitterConfig,
        eventPayload: IStartParticleEffectPayload,
    ): ParticleEmitterConfig {
        const velocityConfig = this.createVelocityEmitterConfig(particleEffect);

        return {
            frame: eventPayload.particleSet.assets.map((asset) => asset.frameName),
            lifespan: particleEffect.lifespan,
            ...velocityConfig,
            gravityY: particleEffect.gravityY,
            reserve: particleEffect.reserve,
            maxAliveParticles: particleEffect.maxAliveParticles,
            scale: particleEffect.scale,
            rotate: particleEffect.rotate,
            alpha: particleEffect.alpha,
            tint: particleEffect.tint,
            frequency: particleEffect.frequency,
            quantity: particleEffect.quantity,
            x: {
                min: particleEffect.emitArea.x,
                max: particleEffect.emitArea.x + particleEffect.emitArea.width,
            },
            y: particleEffect.emitArea.y,
            emitting: particleEffect.frequency !== -1,
        };
    }

    /**
     * Раскрывает actions цепочки и применяет event-overrides по id action-а.
     *
     * Overrides намеренно применяются только к дочерним action-emitter-ам. Общие поля события
     * вроде quantity/lifespan остаются настройками root emitter-а и не меняют burst-частицы.
     */
    private createCascadeActionConfigs(
        actions: IParticleEffectCascadeActionConfig[],
        data: IStartParticleEffectPayload,
    ): IResolvedParticleCascadeActionConfig[] {
        return actions.map((action) => ({
            id: action.id,
            type: action.type,
            chance: action.chance,
            destroyDelayMs: action.destroyDelayMs,
            emitter: mergeParticleEffectConfig(
                this.resolvePresetEmitterConfig(action.emitter),
                action.id == null ? undefined : data.cascadeOverrides?.[action.id],
            ),
        }));
    }

    /** Выполняет actions, привязанные к созданию root-частицы, например followEmitter для следа. */
    private runCascadeEmitActions(props: {
        emitterScene: Phaser.Scene;
        textureName: string;
        data: IStartParticleEffectPayload;
        rootEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
        particle: Phaser.GameObjects.Particles.Particle;
        actions: IResolvedParticleCascadeActionConfig[];
    }): void {
        props.actions.forEach((action) => {
            if (action.type === "followEmitter") {
                this.createFollowEmitter({
                    emitterScene: props.emitterScene,
                    textureName: props.textureName,
                    data: props.data,
                    rootEmitter: props.rootEmitter,
                    particle: props.particle,
                    action,
                });
            }
        });
    }

    /** Выполняет actions смерти root-частицы: сначала гасит follow-emitter-ы, затем запускает explodeEmitter. */
    private runCascadeDeathActions(props: {
        emitterScene: Phaser.Scene;
        textureName: string;
        data: IStartParticleEffectPayload;
        particle: Phaser.GameObjects.Particles.Particle;
        actions: IResolvedParticleCascadeActionConfig[];
    }): void {
        this.stopFollowEmitters(props.particle);

        const action = this.pickExplodeAction(props.actions);
        if (action == null) {
            return;
        }

        this.createExplodeEmitter({
            emitterScene: props.emitterScene,
            textureName: props.textureName,
            data: props.data,
            particle: props.particle,
            action,
        });
    }

    /**
     * Создает дочерний emitter, который следует за живой root-частицей.
     *
     * Phaser обновляет `particle.worldPosition` при движении частицы, поэтому follow получает
     * worldPosition, а не локальные `particle.x/y` относительно root emitter-а.
     */
    private createFollowEmitter(props: {
        emitterScene: Phaser.Scene;
        textureName: string;
        data: IStartParticleEffectPayload;
        rootEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
        particle: Phaser.GameObjects.Particles.Particle;
        action: IResolvedParticleCascadeActionConfig;
    }): void {
        const emitterConfig = this.createParticleEmitterConfigFromResolved(props.action.emitter, props.data);
        const emitter = props.emitterScene.add.particles(0, 0, props.textureName, {
            ...emitterConfig,
            follow: props.particle.worldPosition,
            emitting: true,
        });
        this.childDestroyDelayByEmitter.set(
            emitter,
            props.action.destroyDelayMs ?? DEFAULT_CASCADE_CHILD_DESTROY_DELAY_MS,
        );
        this.addFollowEmitterForParticle(props.particle, emitter);
        this.registerEmitter(props.emitterScene, emitter);
        /** Хвост создается после ракеты, поэтому возвращаем root-emitter наверх, чтобы ракета не перекрывалась следом. */
        props.emitterScene.children.bringToTop(props.rootEmitter);
    }

    /**
     * Останавливает follow-emitter-ы частицы и планирует их удаление после затухания.
     *
     * Emitter не уничтожается сразу: уже созданные частицы должны спокойно дожить свой lifespan,
     * иначе след ракеты будет обрываться визуально.
     */
    private stopFollowEmitters(particle: Phaser.GameObjects.Particles.Particle): void {
        const emitters = this.followEmittersByParticle.get(particle);

        if (emitters == null) {
            return;
        }

        this.followEmittersByParticle.delete(particle);
        emitters.forEach((emitter) => {
            emitter.stop();
            const delay = this.childDestroyDelayByEmitter.get(emitter) ?? DEFAULT_CASCADE_CHILD_DESTROY_DELAY_MS;
            this.stopTimers.push(emitter.scene.time.delayedCall(delay, () => this.destroyEmitter(emitter)));
        });
    }

    /** Создает одноразовый дочерний emitter в мировой точке смерти root-частицы. */
    private createExplodeEmitter(props: {
        emitterScene: Phaser.Scene;
        textureName: string;
        data: IStartParticleEffectPayload;
        particle: Phaser.GameObjects.Particles.Particle;
        action: IResolvedParticleCascadeActionConfig;
    }): void {
        const emitterConfig = this.createParticleEmitterConfigFromResolved(props.action.emitter, props.data);
        const emitter = props.emitterScene.add.particles(
            props.particle.worldPosition.x,
            props.particle.worldPosition.y,
            props.textureName,
            {
                ...emitterConfig,
                x: 0,
                y: 0,
                emitting: false,
            },
        );
        this.registerEmitter(props.emitterScene, emitter);
        emitter.explode(props.action.emitter.quantity);

        const delay = props.action.destroyDelayMs ?? DEFAULT_CASCADE_CHILD_DESTROY_DELAY_MS;
        this.stopTimers.push(props.emitterScene.time.delayedCall(delay, () => this.destroyEmitter(emitter)));
    }

    /** Добавляет follow-emitter в индекс по root-частице. */
    private addFollowEmitterForParticle(
        particle: Phaser.GameObjects.Particles.Particle,
        emitter: Phaser.GameObjects.Particles.ParticleEmitter,
    ): void {
        const emitters = this.followEmittersByParticle.get(particle) ?? [];
        emitters.push(emitter);
        this.followEmittersByParticle.set(particle, emitters);
    }

    /** Выбирает один explode action по весам chance, чтобы один root death давал один burst-вариант. */
    private pickExplodeAction(
        actions: IResolvedParticleCascadeActionConfig[],
    ): IResolvedParticleCascadeActionConfig | undefined {
        const explodeActions = actions.filter((action) => action.type === "explodeEmitter");
        const fallback = explodeActions[0];

        if (fallback == null) {
            return undefined;
        }

        const totalChance = explodeActions.reduce(
            (sum, action) => sum + (action.chance ?? DEFAULT_CASCADE_ACTION_CHANCE),
            0,
        );
        let cursor = Math.random() * (totalChance || DEFAULT_CASCADE_ACTION_CHANCE);

        for (const action of explodeActions) {
            cursor -= action.chance ?? DEFAULT_CASCADE_ACTION_CHANCE;
            if (cursor <= 0) {
                return action;
            }
        }

        return fallback;
    }

    /** Раскрывает emitter preset или ссылку base до полного конфига для цепочек и обычных emitter-ов. */
    private resolvePresetEmitterConfig(
        emitter: ParticleEffectPresetEmitterConfig,
    ): IParticleEffectEmitterConfig {
        if ("base" in emitter && emitter.base != null) {
            return mergeParticleEffectConfig(this.resolveBaseEmitterConfig(emitter.base), emitter);
        }

        return emitter as IParticleEffectEmitterConfig;
    }

    /** Создает один Phaser emitter из общего event payload и конкретных опций эмиттера. */
    private createEmitter(props: {
        emitterScene: Phaser.Scene;
        textureName: string;
        data: IStartParticleEffectPayload;
        payload: IParticleEffectEmitterPayload;
    }): void {
        const origin = props.payload.origin ?? this.getDefaultOrigin();
        const emitterConfig = this.createParticleEmitterConfig(props.payload, props.data);
        const emitter = props.emitterScene.add.particles(origin.x, origin.y, props.textureName, emitterConfig);
        this.registerEmitter(props.emitterScene, emitter);

        this.startOneShotEmitter(emitter, emitterConfig, props.payload);

        if (props.data.durationMs == null) {
            return;
        }

        this.stopTimers.push(props.emitterScene.time.delayedCall(props.data.durationMs, () => {
            this.destroyEmitter(emitter);
        }));
    }

    /** Запускает разовый emitter сразу или переводит его в повторяемые залпы по interval. */
    private startOneShotEmitter(
        emitter: Phaser.GameObjects.Particles.ParticleEmitter,
        emitterConfig: ParticleEmitterConfig,
        payload: IParticleEffectEmitterPayload,
    ): void {
        if (emitterConfig.frequency !== -1) {
            return;
        }

        const quantity = emitterConfig.quantity as number;
        if (payload.repeatIntervalMs == null) {
            emitter.explode(quantity);
            return;
        }

        this.startRepeatedExplosion({
            emitter,
            quantity,
            intervalMs: payload.repeatIntervalMs,
            startDelayMs: payload.startDelayMs ?? 0,
        });
    }

    /** Повторяет залп emitter-а с отдельным первым delay и общим интервалом между выстрелами. */
    private startRepeatedExplosion(props: {
        emitter: Phaser.GameObjects.Particles.ParticleEmitter;
        quantity: number;
        intervalMs: number;
        startDelayMs: number;
    }): void {
        const explode = () => {
            if (this.activeEmitters.includes(props.emitter)) {
                props.emitter.explode(props.quantity);
            }
        };

        const createLoopTimer = () => {
            this.stopTimers.push(props.emitter.scene.time.addEvent({
                delay: props.intervalMs,
                loop: true,
                callback: explode,
            }));
        };

        if (props.startDelayMs <= 0) {
            explode();
            createLoopTimer();
            return;
        }

        this.stopTimers.push(props.emitter.scene.time.delayedCall(props.startDelayMs, () => {
            explode();
            createLoopTimer();
        }));
    }

    /** Уничтожает один emitter и удаляет его из списка активных эффектов. */
    private destroyEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
        const index = this.activeEmitters.indexOf(emitter);
        if (index >= 0) {
            this.activeEmitters.splice(index, 1);
        }
        this.childDestroyDelayByEmitter.delete(emitter);
        this.deleteFollowEmitter(emitter);
        emitter.destroy();
    }

    /** Регистрирует любой emitter в общей механике depth, cleanup и shutdown-watch слоя. */
    private registerEmitter(
        emitterScene: Phaser.Scene,
        emitter: Phaser.GameObjects.Particles.ParticleEmitter,
    ): void {
        emitter.setDepth(this.config.depth);
        emitterScene.children.bringToTop(emitter);
        this.activeEmitters.push(emitter);
        this.watchEmitterSceneShutdown(emitterScene, emitter);
    }

    /** Удаляет emitter из индекса follow-emitter-ов, если он уничтожается раньше root-частицы. */
    private deleteFollowEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
        this.followEmittersByParticle.forEach((emitters, particle) => {
            const index = emitters.indexOf(emitter);
            if (index < 0) {
                return;
            }

            emitters.splice(index, 1);
            if (emitters.length === 0) {
                this.followEmittersByParticle.delete(particle);
            }
        });
    }

    /** Возвращает texture key из payload события, потому что Phaser emitter принимает один atlas за запуск. */
    private getTextureName(data: IStartParticleEffectPayload): string {
        return data.particleSet.assets[0].url;
    }

    /** Ставит эмиттер над верхней границей сцены, если событие не передало origin явно. */
    private getDefaultOrigin(): { x: number; y: number } {
        return {
            x: 0,
            y: 0,
        };
    }

    /** Выбирает верхнюю активную сцену, чтобы частицы работали поверх modal-сцен, которые паузят parent. */
    private getEmitterScene(): Phaser.Scene {
        const activeScenes = this.scene.scene.manager.getScenes(true);
        return activeScenes[activeScenes.length - 1] ?? this.scene;
    }

    /** Снимает ссылку на emitter, если временная сцена с частицами закрылась раньше самого слоя. */
    private watchEmitterSceneShutdown(
        emitterScene: Phaser.Scene,
        emitter: Phaser.GameObjects.Particles.ParticleEmitter,
    ): void {
        const onEmitterSceneShutdown = () => {
            const index = this.activeEmitters.indexOf(emitter);
            if (index >= 0) {
                this.activeEmitters.splice(index, 1);
            }
        };

        emitterScene.events.once(Phaser.Scenes.Events.SHUTDOWN, onEmitterSceneShutdown);
        this.unSubEmitterSceneShutdowns.push(() => {
            emitterScene.events.off(Phaser.Scenes.Events.SHUTDOWN, onEmitterSceneShutdown);
        });
    }

    /** Поднимает слой и активный emitter над остальными объектами сцены. */
    private bringLayerToTop(): void {
        this.scene.children.bringToTop(this);
        this.activeEmitters.forEach((emitter) => emitter.scene?.children.bringToTop(emitter));
    }
}
