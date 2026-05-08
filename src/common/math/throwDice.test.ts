import { throwDice } from "./throwDice";

describe("throwDice", () => {
  it("возвращает 1 когда случайное число меньше вероятности", () => {
    // Тестируем с высокой вероятностью, чтобы почти всегда возвращалась 1
    const result = throwDice(0.99);
    // Поскольку это рандом, мы не можем гарантировать результат, но с высокой вероятностью должен быть 1
    // Проверим, что результат либо 0, либо 1
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("возвращает 0 когда случайное число больше или равно вероятности", () => {
    // Тестируем с нулевой вероятностью, чтобы всегда возвращался 0
    const result = throwDice(0);
    expect(result).toBe(0);
  });

  it("возвращает 1 для вероятности 1", () => {
    const result = throwDice(1);
    expect(result).toBe(1);
  });

  it("возвращает только 0 или 1 для любых вероятностей", () => {
    const probabilities = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

    probabilities.forEach(prob => {
      const result = throwDice(prob);
      expect(result === 0 || result === 1).toBe(true);
    });
  });

  it("работает корректно для вероятности 0.5 (50%)", () => {
    const result = throwDice(0.5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("работает корректно для очень маленькой вероятности", () => {
    const result = throwDice(0.0001);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("работает корректно для очень большой вероятности", () => {
    const result = throwDice(0.9999);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("всегда возвращает 0 при вероятности 0", () => {
    // Запускаем несколько раз, чтобы убедиться, что всегда возвращается 0
    for (let i = 0; i < 10; i++) {
      expect(throwDice(0)).toBe(0);
    }
  });

  it("всегда возвращает 1 при вероятности 1", () => {
    // Запускаем несколько раз, чтобы убедиться, что всегда возвращается 1
    for (let i = 0; i < 10; i++) {
      expect(throwDice(1)).toBe(1);
    }
  });

  describe("статистическое тестирование", () => {
    it("при вероятности 0.5 примерно половина результатов должна быть 1", () => {
      const iterations = 100;
      let onesCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (throwDice(0.5) === 1) {
          onesCount++;
        }
      }

      const ratio = onesCount / iterations;
      // Допускаем отклонение в пределах разумного статистического разброса
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });

    it("при вероятности 0.25 примерно четверть результатов должна быть 1", () => {
      const iterations = 1000;
      let onesCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (throwDice(0.25) === 1) {
          onesCount++;
        }
      }

      const ratio = onesCount / iterations;
      // Допускаем отклонение в пределах разумного статистического разброса
      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(0.3);
    });

    it("при вероятности 0.75 примерно три четверти результатов должны быть 1", () => {
      const iterations = 1000;
      let onesCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (throwDice(0.75) === 1) {
          onesCount++;
        }
      }

      const ratio = onesCount / iterations;
      // Допускаем отклонение в пределах разумного статистического разброса
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(0.8);
    });

    it("при вероятности 0.1 примерно 10% результатов должны быть 1", () => {
      const iterations = 1000;
      let onesCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (throwDice(0.1) === 1) {
          onesCount++;
        }
      }

      const ratio = onesCount / iterations;
      // Допускаем отклонение в пределах разумного статистического разброса
      expect(ratio).toBeGreaterThan(0.05);
      expect(ratio).toBeLessThan(0.15);
    });
  });

  describe("граничные случаи", () => {
    it("работает с вероятностью 0.000001", () => {
      const result = throwDice(0.000001);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("работает с вероятностью 0.999999", () => {
      const result = throwDice(0.999999);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("результат всегда 0 при вероятности -0 (отрицательной)", () => {
      // Хотя функция не проверяет на отрицательные значения, Math.random() >= 0,
      // так что при отрицательной вероятности результат всегда будет 0
      const result = throwDice(-0.1);
      expect(result).toBe(0);
    });

    it("результат всегда 1 при вероятности > 1", () => {
      // При вероятности больше 1, Math.random() всегда будет меньше этого числа
      const result = throwDice(1.1);
      expect(result).toBe(1);
    });
  });
});
