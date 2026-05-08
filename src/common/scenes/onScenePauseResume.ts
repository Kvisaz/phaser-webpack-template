interface IProps {
  scene: Phaser.Scene;
  onSwitch: (paused: boolean) => void;
}

export const onScenePauseResume = ({ scene, onSwitch }: IProps) => {

  const onPause = () => {
    onSwitch(true);
  };
  const onResume = () => {
    onSwitch(false);
  };

  scene.events.on(Phaser.Scenes.Events.PAUSE, onPause);
  scene.events.on(Phaser.Scenes.Events.RESUME, onResume);

  return () => {
    scene.events.off(Phaser.Scenes.Events.PAUSE, onPause);
    scene.events.off(Phaser.Scenes.Events.RESUME, onResume);
  };
};
