/**
 * бросает кость (случайное число)
 * если число попадает в вероятность - возвращает 1
 * иначе 0
 * **/
export function throwDice(probability: number): number {
  return Math.random() < probability ? 1 : 0;
}
