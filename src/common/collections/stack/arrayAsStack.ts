export type Stack<T> = T[];
export const takeTopStack = <T>(s: Stack<T>) => s.pop();
const putTopStack  = <T>(s: Stack<T>, item: T) => { s.push(item); };
const moveAllFromStackToStackPreserveOrder = <T>(from: Stack<T>, to: Stack<T>) => {
  // вернуть исходный порядок: перекладываем с конца
  for (let i = from.length - 1; i >= 0; i--) to.push(from[i]);
  from.length = 0;
};
