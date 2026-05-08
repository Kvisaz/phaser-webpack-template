/**
 * Оптимизированная функция, которая вставляет items в to,
 * если задан atIndex - то с этой позиции
 * **/
export function insertInArray<T>(to: T[], items: T | T[], atIndex?: number): T[] {
  const isArray = Array.isArray(items);
  const itemsLength = isArray ? items.length : 1;
  if (itemsLength === 0) return to;

  const oldLength = to.length;
  const rawIndex = atIndex != null && !Number.isNaN(atIndex) ? atIndex : oldLength;
  const targetIndex = Math.max(0, Math.min(rawIndex, oldLength));

  // если индекс в конце или за пределами — просто дописываем
  if (targetIndex >= oldLength) {
    if (isArray) {
      to.push(...items);
    } else {
      to.push(items);
    }
    return to;
  }

  const insertCount = itemsLength;
  const newLength = oldLength + insertCount;

  // расширяем массив до новой длины и сдвигаем хвост вправо
  to.length = newLength;
  for (let i = newLength - 1; i >= targetIndex + insertCount; i--) {
    to[i] = to[i - insertCount];
  }

  // вставляем элементы в освободившееся окно
  if (isArray) {
    for (let i = 0; i < insertCount; i++) {
      to[targetIndex + i] = items[i];
    }
  } else {
    to[targetIndex] = items;
  }

  return to;
}
