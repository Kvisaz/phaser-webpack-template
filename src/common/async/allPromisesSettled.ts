/**
 * Полифилл Promise.allSettled для старых систем
 * ✔️ ошибки не прерывают исполнение других
 * ✔️ порядок сохранён
 * ✔️ типы корректные
 * ✔️ работает при target: es5
 * **/
export function allPromisesSettled<T>(promises: Promise<T>[]): Promise<PromiseSettledResult<T>[]> {
  return Promise.all(
    promises.map((p) =>
      p.then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason) => ({ status: "rejected" as const, reason }),
      ),
    ),
  );
}

export type PromiseSettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };
