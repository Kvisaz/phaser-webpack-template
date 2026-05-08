/**
 * хелпер для функциональной записи массового создания объектоы
 *
 * Создать объект,
 * при необходимости как-то сразу обратиться к нему
 * и вернуть
 * **/
export function createGO<T extends Phaser.GameObjects.GameObject>(create:  () => T, args: {
  use?: (obj: T) => void;
} = {}): T {
  const obj = create();
  args.use?.(obj);
  return obj;
}
