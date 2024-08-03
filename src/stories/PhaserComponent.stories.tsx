// src/PhaserComponent.stories.tsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Пример Phaser компонента
class MyPhaserComponent extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const text = scene.add.text(0, 0, 'Hello Phaser!', { color: '#ffffff' });
    this.add(text);
  }
}

// Обертка React для Phaser компонента
const PhaserComponentWrapper = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        scene: {
          create: function(this: Phaser.Scene) {
            const component = new MyPhaserComponent(this, 400, 300);
            this.add.existing(component);
          }
        }
      };

      const game = new Phaser.Game(config);

      return () => {
        game.destroy(true);
      };
    }
  }, []);

  return <div ref={gameRef} />;
};

// Storybook история
export default {
  title: 'Phaser/MyComponent',
  component: PhaserComponentWrapper,
};

export const Default = () => <PhaserComponentWrapper />;
