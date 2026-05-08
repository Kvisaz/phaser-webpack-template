export interface ISetSceneDataProps<T> {
  scene: Phaser.Scene;
  key: string;
  data: T;
}

/** подумайте над специализированным менеджером вместо этих методов **/
export function setSceneData<T>({ scene, key, data }: ISetSceneDataProps<T>) {
  scene.data.set(key, data);
}
