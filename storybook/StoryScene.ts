export class StoryScene extends Phaser.Scene {
  preload() {
    /** включает в себя загрузку текстуры поэтому ставим тут **/
    // addTestMapBg(this).catch(console.warn);
  }
  create() {
    console.log("Story Scene created...");
  }
}
