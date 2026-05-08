/** for free-up any resources that may be in use by your Scene **/
export const onGamePause = (scene: Phaser.Scene, callback: ()=>void) => {
  scene.game.events.on(Phaser.Core.Events.PAUSE, callback);
};

export const onGameResume = (scene: Phaser.Scene, callback: ()=>void) => {
  scene.game.events.on(Phaser.Core.Events.RESUME, callback);
};

export const onGameVisible = (scene: Phaser.Scene, callback: ()=>void)=>{
  scene.game.events.on(Phaser.Core.Events.VISIBLE, callback);
}

export const onGameHidden = (scene: Phaser.Scene, callback: ()=>void)=>{
  scene.game.events.on(Phaser.Core.Events.HIDDEN, callback);
}
