type PEConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

interface IFireworksEffectProps {
  scene: Phaser.Scene;
  textureName: string;
  frameNames: string[];
  leftAngle?: PEConfig["angle"];
  rightAngle?: PEConfig["angle"];
  particleOptions?: Partial<PEConfig>;
}

export class FireworksEffect {
  protected readonly props: IFireworksEffectProps;
  readonly leftEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  readonly rightEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(props: IFireworksEffectProps) {
    this.props = props;
    const { scene, textureName, frameNames, particleOptions, leftAngle, rightAngle } = props;

    const commonConfig: PEConfig = {
      frame: frameNames,
      lifespan: { min: 1200, max: 2000 },
      speed: { min: 600, max: 1000 },
      scale: { start: 1, end: 1.2 },
      rotate: { start: 0, end: 360 },
      gravityY: 380,
      frequency: 1200,
      quantity: 6,
      emitting: false,
      ...particleOptions
    };

    const centerY = scene.scale.height * 0.6;

    this.leftEmitter = scene.add.particles(0, centerY, textureName, {
      ...commonConfig,
      angle: leftAngle ?? { min: 270, max: 330 },
    });

    this.rightEmitter = scene.add.particles(scene.scale.width, centerY, textureName, {
      ...commonConfig,
      angle: rightAngle ?? { min: 210, max: 270 },
    });
  }

  destroy() {
    this.leftEmitter.destroy();
    this.rightEmitter.destroy();
  }

  start() {
    this.updatePositions();
    this.leftEmitter.start();
    this.rightEmitter.start();
  }

  stop() {
    this.leftEmitter.stop();
    this.rightEmitter.stop();
  }

  protected updatePositions() {
    const { scene } = this.props;
    const centerY = scene.scale.height * 0.6;
    this.leftEmitter.setPosition(0, centerY);
    this.rightEmitter.setPosition(scene.scale.width, centerY);
  }
}
