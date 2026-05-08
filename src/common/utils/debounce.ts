/**
 * Creates a debounced function that delays invoking the provided function
 * until after wait milliseconds have elapsed since the last time the
 * debounced function was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns The new debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: number | null = null;

  return function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(later, wait) as unknown as number;
  } as T;
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every wait milliseconds.
 *
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle executions to
 * @returns The new throttled function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: number | null = null;
  let lastExecTime = 0;

  return function(this: any, ...args: Parameters<T>) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime >= wait) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else if (timeout === null) {
      timeout = window.setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
        timeout = null;
      }, wait - (currentTime - lastExecTime)) as unknown as number;
    }
  } as T;
}
