export type GameObject =
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.RenderTexture
  | Phaser.GameObjects.Shape
  | Phaser.GameObjects.TileSprite;

export interface IStory {
  title: string;
  /**
   *  run
   *  - может создавать что угодно на сцене
   *  - возвращаемая функция должна очищать созданный объект
   *  - добавление к сцене лежит на его ответственности
   */
  run: (scene: Phaser.Scene) => Promise<() => void>;
}

export interface IStoryListItem extends Partial<IStory>{
  title: string;
  template?: 'titleDelimiter',
  run?: (scene: Phaser.Scene) => Promise<() => void>;
}

export const storyTitle = (title:string):IStoryListItem=>({ title, template: 'titleDelimiter'})
