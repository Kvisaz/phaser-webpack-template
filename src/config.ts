import { MainScene } from "./scenes/MainScene";

const scaleConfig: Phaser.Types.Core.ScaleConfig = {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  parent: "game",
  width: 960,
  height: 640
};

export interface IPhaserConfig extends Phaser.Types.Core.GameConfig {
  scale: Phaser.Types.Core.ScaleConfig;
}

export const phaserGameConfig: IPhaserConfig = {
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 200 }
    }
  },
  type: Phaser.AUTO,
  backgroundColor: "#4488aa",
  transparent: true,
  scale: scaleConfig,
  scene: [MainScene]
};
