/**
 * Не все эти сцены могут использоваться сразу в одной игре
 * но очевижно что почти все они нужны
 * @deprecated используй конкретные имена для конкретной игры на уровне ее сцен
 * **/
export enum Scenes {
  Boot = "Boot",
  Start = "Start",
  SpiderStart = "SpiderStart",
  Game = "Game",
  SpiderGame = "SpiderGame",
  GameOver = "GameOver",
  AdFullScreen = "AdFullScreen",
  LevelSelect = "LevelSelect",
  Settings = "Settings",
  Shop = "Shop",
  TestScene = "TestScene",
}

export function isSceneKey(key: string): key is Scenes {
  return key in Scenes;
}
