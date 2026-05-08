export interface ITextFloaterProps {
  scene: Phaser.Scene,
  text: string;
  textStyle: Partial<Phaser.GameObjects.TextStyle>;
  x: number;
  y: number;
  velocityX: number; // pixels / s
  velocityY: number; // pixels / s
  origin: number;
  duration: number;
}

export interface ITextFloaterConstructorArgs extends Partial<ITextFloaterProps>{
  scene: Phaser.Scene,
}

export const DefaultTextFloaterProps: Omit<ITextFloaterProps, 'scene'> = {
  duration: 1200,
  origin: 0.5,
  textStyle: {
    fontSize: '36px',
    color: 'white',
    fontFamily: 'Open Sans',
    align: 'center',
    strokeThickness: 4,
    stroke: '#000000'
  },
  velocityX: 0,
  velocityY: -100,
  text: 'Hello',
  x: 200,
  y: 200
}