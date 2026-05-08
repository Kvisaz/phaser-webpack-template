export interface IGetSceneDataProps<T> {
  scene: Phaser.Scene;
  key: string;
}

/** подумайте над специализированным менеджером вместо этих методов **/
export function getSceneData<T>({ scene, key }: IGetSceneDataProps<T>): T | undefined {
  return scene.data.get(key) as T | undefined;
}
