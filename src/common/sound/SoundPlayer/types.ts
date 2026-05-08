export interface IPlaySoundProps {
  soundKey: string;
  channelKey?: string;
  loop?: boolean;
  volume?: number;
}

export interface IPauseSoundProps {
  soundKey: string;
}

export interface IStopSoundProps {
  soundKey: string;
}

export interface ISetMutedProps {
  muted: boolean;
}

export interface ISetChannelMutedProps {
  channelKey: string;
  muted: boolean;
}
