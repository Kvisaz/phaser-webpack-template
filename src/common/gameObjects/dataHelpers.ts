/**
 *  Если ты сойдешь с ума и снова захочешь построить универсальнеую систему типизированной рабобты с данными
 *  в Phaser
 *
 *  ПРОСТО ПОСМОТРИ И СДЕЛАЙ ТАК ЖЕ ПОД КОНКРЕТНЫЙ СЛУЧАЙ
 *  вместо простого id может сразу паковать объект-стейт
 **/

/** в принципе работает **/
export function data<T extends Record<string, unknown>>(obj: Phaser.GameObjects.GameObject) {
  return {
    get<K extends keyof T>(key: K): T[K] | undefined {
      return obj.getData(key as string) as T[K] | undefined;
    },
    set<K extends keyof T>(key: K, value: T[K]): void {
      obj.setData(key as string, value);
    },
    delete<K extends keyof T>(key: K): void {
      obj.setData(key as string, undefined);
    },
  };
}
