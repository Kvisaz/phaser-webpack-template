export enum StandardCardSoundName {
  cardFlip = "cardFlip",
  cardNegative = "cardNegative",
  cardMove = "cardMove",
  cardMassMove = "cardMassMove",
}

export interface ICardSoundPlayer {
  play(sound: StandardCardSoundName): void;
}
