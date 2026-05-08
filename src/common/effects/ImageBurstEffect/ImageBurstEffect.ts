import {ImageEffectPool} from "../ImageEffectPool";
import {IEffectPoint, IImageBurstEffectConfig, IImageEffectAsset} from "../types";

const DEFAULT_BURST_CONFIG: Required<IImageBurstEffectConfig> = {
  amount: 8,
  scaleMin: 0.3,
  scaleMax: 0.48,
  scaleMultiplier: 1,
  speedMin: 180,
  speedMax: 420,
  gravity: 760,
  duration: 820,
  fadeStartK: 0.62,
  angleStart: 205,
  angleEnd: 335,
};

interface IProps {
  scene: Phaser.Scene;
  parent?: Phaser.GameObjects.Container;
  asset: IImageEffectAsset;
  pool?: ImageEffectPool;
  startPoint: IEffectPoint;
  config: IImageBurstEffectConfig;
  onComplete?: () => void;
}

/**
 * Одноразовый разлет image-частиц от общей точки.
 *
 * Частицы не замирают в конце: летят по скорости и падают под гравитацией.
 **/
export class ImageBurstEffect {
  private readonly particles = new Set<Phaser.GameObjects.Image>();
  private isDestroyed = false;
  private remaining = 0;
  private readonly config: Required<IImageBurstEffectConfig>;

  constructor(private readonly props: IProps) {
    const config = {
      ...DEFAULT_BURST_CONFIG,
      ...props.config,
    };
    this.config = {
      ...config,
      amount: Math.max(0, config.amount),
      duration: Math.max(1, config.duration),
      fadeStartK: Phaser.Math.Clamp(config.fadeStartK, 0, 0.98),
    };
    this.createParticles();
    this.remaining = this.particles.size;
    this.run();
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    [...this.particles].forEach((particle) => this.releaseParticle(particle));
  }

  private createParticles(): void {
    const {scene, parent, asset, pool, startPoint} = this.props;

    Array.from({length: this.config.amount}).forEach(() => {
      const scale =
        Phaser.Math.FloatBetween(this.config.scaleMin, this.config.scaleMax) * this.config.scaleMultiplier;
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
    if (this.particles.size === 0) {
      this.finish();
      return;
    }

    [...this.particles].forEach((particle, index) => this.flyParticle(particle, index));
  }

  private flyParticle(particle: Phaser.GameObjects.Image, index: number): void {
    if (particle.scene == null) {
      this.finishOne();
      return;
    }

    const angleStep = (this.config.angleEnd - this.config.angleStart) / Math.max(1, this.config.amount - 1);
    const angleJitter = Phaser.Math.FloatBetween(-angleStep * 0.35, angleStep * 0.35);
    const angleDeg = this.config.angleStart + angleStep * index + angleJitter;
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    const speed = Phaser.Math.FloatBetween(this.config.speedMin, this.config.speedMax);
    const velocityX = Math.cos(angleRad) * speed;
    const velocityY = Math.sin(angleRad) * speed;
    const startX = this.props.startPoint.x;
    const startY = this.props.startPoint.y;

    particle.scene.tweens.add({
      targets: particle,
      alpha: 0,
      duration: this.config.duration,
      ease: Phaser.Math.Easing.Linear,
      onUpdate: (tween) => {
        const k = tween.progress;
        const seconds = (this.config.duration * k) / 1000;
        particle.setPosition(
          startX + velocityX * seconds,
          startY + velocityY * seconds + (this.config.gravity * seconds * seconds) / 2,
        );

        if (k < this.config.fadeStartK) {
          particle.setAlpha(1);
        } else {
          particle.setAlpha(1 - (k - this.config.fadeStartK) / (1 - this.config.fadeStartK));
        }
      },
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
