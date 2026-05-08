import { makeRandomAmount } from "./makeRandomAmount";

describe("makeRandomAmount", () => {
  it("возвращает 0 когда случайное число больше или равно вероятности", () => {
    const result = makeRandomAmount({ lootK: 10, probability: 0, disperse: 5 });
    expect(result).toBe(0);
  });

  it("возвращает lootK когда дисперсия 0 и вероятность 1", () => {
    const result = makeRandomAmount({ lootK: 10, probability: 1, disperse: 0 });
    expect(result).toBe(10);
  });

  it("возвращает lootK + значение в диапазоне [0, disperse] при успехе", () => {
    const result = makeRandomAmount({ lootK: 10, probability: 1, disperse: 5 });
    expect(result).toBeGreaterThanOrEqual(10); // lootK
    expect(result).toBeLessThanOrEqual(15); // lootK + disperse
  });

  it("всегда возвращает 0 при вероятности 0", () => {
    for (let i = 0; i < 10; i++) {
      const result = makeRandomAmount({ lootK: 100, probability: 0, disperse: 10 });
      expect(result).toBe(0);
    }
  });

  it("всегда возвращает lootK при дисперсии 0 и вероятности 1", () => {
    for (let i = 0; i < 10; i++) {
      const result = makeRandomAmount({ lootK: 50, probability: 1, disperse: 0 });
      expect(result).toBe(50);
    }
  });

  it("возвращает 0 при отрицательной вероятности", () => {
    const result = makeRandomAmount({ lootK: 10, probability: -0.1, disperse: 5 });
    expect(result).toBe(0);
  });

  it("возвращает lootK + значение в диапазоне [0, disperse] при вероятности > 1", () => {
    const result = makeRandomAmount({ lootK: 20, probability: 1.5, disperse: 3 });
    expect(result).toBeGreaterThanOrEqual(20);
    expect(result).toBeLessThanOrEqual(23);
  });

  describe("диапазон значений", () => {
    it("возвращает значения в правильном диапазоне при дисперсии 1", () => {
      for (let i = 0; i < 20; i++) {
        const result = makeRandomAmount({ lootK: 100, probability: 1, disperse: 1 });
        expect(result).toBeGreaterThanOrEqual(100);
        expect(result).toBeLessThanOrEqual(101);
      }
    });

    it("возвращает значения в правильном диапазоне при дисперсии 10", () => {
      for (let i = 0; i < 20; i++) {
        const result = makeRandomAmount({ lootK: 50, probability: 1, disperse: 10 });
        expect(result).toBeGreaterThanOrEqual(50);
        expect(result).toBeLessThanOrEqual(60);
      }
    });

    it("всегда возвращает lootK при дисперсии 0", () => {
      for (let i = 0; i < 20; i++) {
        const result = makeRandomAmount({ lootK: 100, probability: 1, disperse: 0 });
        expect(result).toBe(100);
      }
    });

    it("может вернуть lootK при положительной дисперсии", () => {
      let foundExactLootK = false;
      for (let i = 0; i < 100; i++) {
        const result = makeRandomAmount({ lootK: 100, probability: 1, disperse: 5 });
        if (result === 100) {
          foundExactLootK = true;
          break;
        }
      }
      expect(foundExactLootK).toBe(true);
    });

    it("может вернуть lootK + disperse при положительной дисперсии", () => {
      let foundMaxValue = false;
      for (let i = 0; i < 200; i++) {
        const result = makeRandomAmount({ lootK: 100, probability: 1, disperse: 5 });
        if (result === 105) {
          foundMaxValue = true;
          break;
        }
      }
      expect(foundMaxValue).toBe(true);
    });
  });

  describe("статистическое тестирование", () => {
    it("при вероятности 0.5 примерно половина результатов должна быть 0", () => {
      const iterations = 1000;
      let zeroCount = 0;
      let nonZeroCount = 0;

      for (let i = 0; i < iterations; i++) {
        const result = makeRandomAmount({ lootK: 10, probability: 0.5, disperse: 2 });
        if (result === 0) {
          zeroCount++;
        } else {
          nonZeroCount++;
        }
      }

      const ratio = zeroCount / iterations;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });

    it("при вероятности 0.25 примерно 25% результатов должны быть ненулевыми", () => {
      const iterations = 1000;
      let zeroCount = 0;

      for (let i = 0; i < iterations; i++) {
        const result = makeRandomAmount({ lootK: 10, probability: 0.25, disperse: 3 });
        if (result === 0) {
          zeroCount++;
        }
      }

      const ratio = zeroCount / iterations;
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(0.8);
    });

    it("при вероятности 0.75 примерно 75% результатов должны быть ненулевыми", () => {
      const iterations = 1000;
      let zeroCount = 0;

      for (let i = 0; i < iterations; i++) {
        const result = makeRandomAmount({ lootK: 10, probability: 0.75, disperse: 2 });
        if (result === 0) {
          zeroCount++;
        }
      }

      const ratio = zeroCount / iterations;
      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(0.3);
    });

    it("значения распределены равномерно в диапазоне [lootK, lootK + disperse]", () => {
      const iterations = 1000;
      const lootK = 10;
      const disperse = 4;
      const counts = new Array(disperse + 1).fill(0); // [0, 0, 0, 0, 0] for disperse=4

      for (let i = 0; i < iterations; i++) {
        const result = makeRandomAmount({ lootK, probability: 1, disperse });
        if (result !== 0) { // Should always be non-zero since probability=1
          const offset = result - lootK; // Should be in range [0, disperse]
          if (offset >= 0 && offset <= disperse) {
            counts[offset]++;
          }
        }
      }

      // Проверяем, что все возможные значения хотя бы один раз встретились
      // и что распределение не слишком неравномерное
      const minExpected = iterations / (disperse + 1) * 0.5; // Allow 50% tolerance
      const maxExpected = iterations / (disperse + 1) * 1.5;

      counts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(minExpected);
        expect(count).toBeLessThanOrEqual(maxExpected);
      });
    });
  });

  describe("граничные случаи", () => {
    it("работает с lootK = 0", () => {
      const result = makeRandomAmount({ lootK: 0, probability: 1, disperse: 5 });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    it("работает с disperse = 0", () => {
      const result = makeRandomAmount({ lootK: 100, probability: 1, disperse: 0 });
      expect(result).toBe(100);
    });

    it("работает с lootK = 0 и disperse = 0", () => {
      const result = makeRandomAmount({ lootK: 0, probability: 1, disperse: 0 });
      expect(result).toBe(0);
    });

    it("работает с большими значениями", () => {
      const result = makeRandomAmount({ lootK: 1000000, probability: 1, disperse: 100000 });
      expect(result).toBeGreaterThanOrEqual(1000000);
      expect(result).toBeLessThanOrEqual(1100000);
    });

    it("работает с дисперсией 1", () => {
      const result = makeRandomAmount({ lootK: 50, probability: 1, disperse: 1 });
      expect(result === 50 || result === 51).toBe(true);
    });

    it("работает с очень маленькой вероятностью", () => {
      const result = makeRandomAmount({ lootK: 100, probability: 0.0001, disperse: 10 });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(110); // lootK + disperse
    });
  });

  describe("комбинации параметров", () => {
    it("правильно обрабатывает lootK = 10, probability = 0.5, disperse = 3", () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = makeRandomAmount({ lootK: 10, probability: 0.5, disperse: 3 });
        results.push(result);
      }

      // Должны быть как 0, так и значения в диапазоне [10, 13]
      const zeros = results.filter(r => r === 0).length;
      const nonZeros = results.filter(r => r >= 10 && r <= 13).length;

      expect(zeros + nonZeros).toBe(100);
      expect(results.every(r => r === 0 || (r >= 10 && r <= 13))).toBe(true);
    });

    it("правильно обрабатывает lootK = 5, probability = 0.8, disperse = 2", () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = makeRandomAmount({ lootK: 5, probability: 0.8, disperse: 2 });
        results.push(result);
      }

      // Большинство результатов должно быть в диапазоне [5, 7], немного 0
      const nonZeros = results.filter(r => r >= 5 && r <= 7).length;
      const zeros = results.filter(r => r === 0).length;

      expect(nonZeros + zeros).toBe(100);
      expect(results.every(r => r === 0 || (r >= 5 && r <= 7))).toBe(true);
    });
  });
});
