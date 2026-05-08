import { ICardSoundPlayer, StandardCardSoundName } from "./types";

interface SoundData {
  key: string;
  volume?: number;
}

interface IProps {
  scene: Phaser.Scene;
  soundKeys: Record<StandardCardSoundName, SoundData>;
}

export class CardSounds implements ICardSoundPlayer {
  constructor(protected props: IProps) {}

  play(sound: StandardCardSoundName) {
    console.log('CardSounds play sound', sound);
    try {
      const soundData = this.props.soundKeys[sound];
      this.props.scene.sound.play(soundData.key, { volume: soundData.volume });
    } catch (e) {
      console.warn(e);
    }
  }
}
