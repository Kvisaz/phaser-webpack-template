import {AnimaMover} from "../../animations";
import {ImageEffectPool} from "../ImageEffectPool";
import {IEffectPoint, IImageEffectAsset, IImageFlyEffectConfig} from "../types";

interface IProps {
  scene: Phaser.Scene;
  parent?: Phaser.GameObjects.Container;
  asset: IImageEffectAsset;
  pool?: ImageEffectPool;
  startPoint: IEffectPoint;
  targetPoint: IEffectPoint;
  config: IImageFlyEffectConfig;
  onComplete?: () => void;
}

/**
 * Одноразовый полет image-частиц от точки к точке.
 *
 * Сначала частицы немного разлетаются от старта, затем летят к цели по дуге.
 **/
export class ImageFlyEffect {
  private readonly particles = new Set<Phaser.GameObjects.Image>();
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private isDestroyed = false;
  private remaining = 0;

  constructor(private readonly props: IProps) {
    this.createParticles();
    this.remaining = this.particles.size;
    this.run();
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.length = 0;
    [...this.particles].forEach((particle) => this.releaseParticle(particle));
  }

  private createParticles(): void {
    const {scene, parent, asset, pool, startPoint, config} = this.props;

    Array.from({length: config.amount}).forEach(() => {
      const scale = Phaser.Math.FloatBetween(config.scaleMin, config.scaleMax);
      const particle = pool?.acquire(startPoint, scale)
        ?? scene.add.image(startPoint.x, startPoint.y, asset.url, asset.frameName);

      if (pool == null) {
        parent?.add(particle);
        particle.setScale(scale);
        particle.setAlpha(1);
      }

      this.particles.add(particle);
    });
  }

  private run(): void {
    const {config} = this.props;

    if (this.particles.size === 0) {
      this.finish();
      return;
    }

    AnimaMover.explode({
      targets: [...this.particles],
      distance: config.burstDistance,
      distanceDisperce: 0.45,
      duration: config.burstDuration,
      onComplete: () => this.flyParticles(),
    });
  }

  private flyParticles(): void {
    const {scene, config} = this.props;

    [...this.particles].forEach((particle, index) => {
      const timer = scene.time.delayedCall(index * config.flyStepMs, () => {
        if (this.isDestroyed) {
          return;
        }

        this.flyParticle(particle);
      });
      this.timers.push(timer);
    });
  }

  private flyParticle(particle: Phaser.GameObjects.Image): void {
    if (particle.scene == null) {
      this.finishOne();
      return;
    }

    const {targetPoint, config} = this.props;
    const dist = Phaser.Math.Distance.Between(particle.x, particle.y, targetPoint.x, targetPoint.y);
    const duration = Phaser.Math.Clamp(320 + dist * 0.55, config.flyDurationMin, config.flyDurationMax);
    const arcHeight = -Phaser.Math.Clamp(50 + dist * config.arcHeightK, config.arcHeightMin, config.arcHeightMax);

    AnimaMover.flyArc({
      target: particle,
      targetX: targetPoint.x,
      targetY: targetPoint.y,
      duration,
      arcHeight,
      ease: Phaser.Math.Easing.Cubic.InOut,
      onComplete: () => {
        this.releaseParticle(particle);
        this.finishOne();
      },
    });
  }

  private releaseParticle(particle: Phaser.GameObjects.Image): void {
    if (!this.particles.delete(particle)) {
      return;
    }

    if (this.props.pool != null) {
      this.props.pool.release(particle);
      return;
    }

    particle.scene?.tweens.killTweensOf(particle);
    particle.destroy();
  }

  private finishOne(): void {
    if (this.isDestroyed) {
      return;
    }

    this.remaining -= 1;
    if (this.remaining > 0) {
      return;
    }

    this.finish();
  }

  private finish(): void {
    if (this.isDestroyed) {
      return;
    }

    this.props.onComplete?.();
    this.destroy();
  }
}
