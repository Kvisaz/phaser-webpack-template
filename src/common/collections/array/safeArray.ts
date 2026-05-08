export const safeArray = <T>(array: (T|undefined)[]): T[] => {
  return array.filter(Boolean) as T[];
};
