/**
 *  Набор готовых шаблонов для эффектов на частицах
 **/
export class Particles {
  static explode(args: {
    scene: Phaser.Scene,
    textureName: string;
    frameNames: string[];
  }){
    const { scene, textureName } = args;

    const emitter = scene.add.particles(0, 0, textureName, {
      frame: [ 'Match3_Icon_30', 'Match3_Icon_29' ],
      lifespan: 4000,
      speed: { min: 200, max: 350 },
      scale: { start: 0.4, end: 0 },
      rotate: { start: 0, end: 360 },
      gravityY: 200,
      emitting: false
    });
  }

}
