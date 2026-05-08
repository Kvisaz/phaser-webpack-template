import { SimpleTimer } from "./SimpleTimer";
import { onGameHidden, onGamePause, onGameResume, onGameVisible } from "../../../scenes";

export interface ISimpleGameSessionTimerProps {
  scene: Phaser.Scene;
  intervalMs?: number;
  onTick: (currentSessionMs: number) => void;
  onPause?: (currentSessionMs: number) => void;
  onResume?: (currentSessionMs: number) => void;
  onEnd: (currentSessionMs: number) => void;
}

/** То же что и Simple Timer
 * - но автоматически ставится на паузу при ухоже на другую вкладку
 * - полезно для подсчета чистого времени
 * **/
export class SimpleGameSessionTimer extends SimpleTimer {
  constructor(props: ISimpleGameSessionTimerProps) {
    super(props);
    onGamePause(props.scene, () => {
      this.pause();
    });
    onGameVisible(props.scene, () => {
      this.resume();
    });
    onGameResume(props.scene, () => {
      this.resume();
    });
    onGameHidden(props.scene, () => {
      this.pause();
    });
  }
}
