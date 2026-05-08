import { SceneEvents } from "../../events";
import { ISoundPlayerEvents } from "./events";
import {
  IPlaySoundProps,
  IPauseSoundProps,
  ISetChannelMutedProps,
  ISetMutedProps,
  IStopSoundProps,
} from "./types";

interface IProps {
  scene: Phaser.Scene;
}

export class SoundPlayer {
  private readonly sceneEvents: SceneEvents<ISoundPlayerEvents>;
  private channels: Record<string, Set<string>> = {};
  private soundChannels: Record<string, string | undefined> = {};
  private mutedChannels = new Set<string>();
  private pausedByChannelMute = new Set<string>();

  constructor(private readonly props: IProps) {
    this.sceneEvents = new SceneEvents<ISoundPlayerEvents>({ scene: props.scene });

    this.sceneEvents.on("soundPlayerPlay", this.play.bind(this));
    this.sceneEvents.on("soundPlayerPause", this.pause.bind(this));
    this.sceneEvents.on("soundPlayerStop", this.stop.bind(this));
    this.sceneEvents.on("soundPlayerSetMuted", this.setMuted.bind(this));
    this.sceneEvents.on("soundPlayerSetChannelMuted", this.setChannelMuted.bind(this));
  }

  destroy(): void {
    this.sceneEvents.unSubscribeAll();
    Object.values(this.channels).forEach((channel) => channel.clear());
    this.channels = {};
    this.soundChannels = {};
    this.mutedChannels.clear();
    this.pausedByChannelMute.clear();
  }

  play({ soundKey, channelKey, loop, volume }: IPlaySoundProps): void {
    const resolvedChannelKey = this.syncSoundChannel(soundKey, channelKey);
    if (resolvedChannelKey && this.mutedChannels.has(resolvedChannelKey)) {
      return;
    }

    const sound = this.getOrCreateSound(soundKey);
    if (sound.isPlaying) {
      return;
    }

    if (sound.isPaused) {
      sound.resume();
      return;
    }

    sound.play({
      loop,
      volume,
    });
  }

  pause({ soundKey }: IPauseSoundProps): void {
    const sound = this.props.scene.sound.get(soundKey);
    if (!sound) {
      return;
    }

    this.pausedByChannelMute.delete(soundKey);
    sound.pause();
  }

  stop({ soundKey }: IStopSoundProps): void {
    const sound = this.props.scene.sound.get(soundKey);
    if (!sound) {
      return;
    }

    this.pausedByChannelMute.delete(soundKey);
    sound.stop();
  }

  setMuted({ muted }: ISetMutedProps): void {
    this.props.scene.sound.mute = muted;
  }

  setChannelMuted({ channelKey, muted }: ISetChannelMutedProps): void {
    const channel = this.channels[channelKey];
    if (!channel) {
      return;
    }

    if (muted) {
      this.mutedChannels.add(channelKey);
    } else {
      this.mutedChannels.delete(channelKey);
    }

    channel.forEach((soundKey) => {
      const sound = this.props.scene.sound.get(soundKey);
      if (!sound) {
        return;
      }

      if (muted) {
        if (!sound.isPlaying) {
          return;
        }

        sound.pause();
        this.pausedByChannelMute.add(soundKey);
        return;
      }

      if (!this.pausedByChannelMute.has(soundKey) || !sound.isPaused) {
        return;
      }

      sound.resume();
      this.pausedByChannelMute.delete(soundKey);
    });
  }

  private getOrCreateSound(soundKey: string): Phaser.Sound.BaseSound {
    return this.props.scene.sound.get(soundKey) ?? this.props.scene.sound.add(soundKey);
  }

  private syncSoundChannel(soundKey: string, nextChannelKey?: string): string | undefined {
    const currentChannelKey = this.soundChannels[soundKey];
    if (nextChannelKey == null) {
      return currentChannelKey;
    }

    if (currentChannelKey && currentChannelKey !== nextChannelKey) {
      this.channels[currentChannelKey]?.delete(soundKey);
    }

    if (!this.channels[nextChannelKey]) {
      this.channels[nextChannelKey] = new Set<string>();
    }

    this.channels[nextChannelKey].add(soundKey);
    this.soundChannels[soundKey] = nextChannelKey;
    return nextChannelKey;
  }
}
