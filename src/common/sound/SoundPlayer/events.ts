/** common Эвенты модуля - могут экспортироваться в другие **/
import {
  IPlaySoundProps,
  IPauseSoundProps,
  ISetChannelMutedProps,
  ISetMutedProps,
  IStopSoundProps,
} from "./types";

export interface ISoundPlayerEvents {
  /**
   * Контракт:
   * - воспроизвести звук
   * - если звук уже играет, ничего не делать
   * - если звук стоит на паузе, продолжить воспроизведение
   * - при наличии channelKey привязать soundKey к каналу
   */
  soundPlayerPlay: IPlaySoundProps;

  /**
   * Контракт:
   * - поставить конкретный звук на паузу
   * - это явная пользовательская команда, не channel mute
   */
  soundPlayerPause: IPauseSoundProps;

  /**
   * Контракт:
   * - полностью остановить конкретный звук
   * - после stop последующий play начнет воспроизведение заново
   */
  soundPlayerStop: IStopSoundProps;

  /**
   * Контракт:
   * - включить или выключить глобальный mute для sound manager сцены
   * - не меняет локальное состояние каналов
   */
  soundPlayerSetMuted: ISetMutedProps;

  /**
   * Контракт:
   * - включить или выключить mute конкретного канала
   * - mute ставит на паузу только те звуки канала, которые сейчас играют
   * - unmute продолжает только те звуки, которые были pause-нуты этим mute
   */
  soundPlayerSetChannelMuted: ISetChannelMutedProps;
}
