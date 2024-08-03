import React, { useEffect, useRef } from "react";
import { IPhaserConfig, phaserGameConfig } from "../../config";
import { HelloWorldComponent } from "./index";



const PhaserComponentWrapper = () => {
  const gameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gameRef.current == null) return;
    const config: IPhaserConfig = {
      ...phaserGameConfig,
      parent: gameRef.current as HTMLDivElement,
      scene: [{
        create: function(this: Phaser.Scene) {
          console.log('scene run', this);
          const component = new HelloWorldComponent(this, 100, 100);
          this.add.existing(component);
        }
      }]
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, [gameRef.current]);

  return <div ref={gameRef} />;
};

// Storybook история
export default {
  title: "Phaser/MyComponent",
  component: PhaserComponentWrapper
};

export const Primary = () => <PhaserComponentWrapper />;
