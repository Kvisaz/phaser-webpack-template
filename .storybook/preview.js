// .storybook/preview.js
import Phaser from 'phaser';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

// Initialize Phaser game instance
const game = new Phaser.Game({
  type: Phaser.HEADLESS,
  width: 800,
  height: 600,
  scene: {
    create: function() {
      this.sys.game.destroy(false);
    }
  }
});

// Make the game instance available globally
window.phaserGame = game;
