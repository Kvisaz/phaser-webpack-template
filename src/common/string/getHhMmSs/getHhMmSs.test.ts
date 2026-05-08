import { getHhMmSs } from "./getHhMmSs";

describe("getHhMmSs", () => {
  it("возвращает 00:00 для 0 мс", () => {
    expect(getHhMmSs(0)).toBe("00:00");
  });

  it("округляет миллисекунды вниз до секунд", () => {
    expect(getHhMmSs(999)).toBe("00:00");
    expect(getHhMmSs(1000)).toBe("00:01");
  });

  it("форматирует минуты и секунды, когда часов нет", () => {
    expect(getHhMmSs(5_000)).toBe("00:05");
    expect(getHhMmSs(60_000)).toBe("01:00");
    expect(getHhMmSs(65_000)).toBe("01:05");
    expect(getHhMmSs(3_599_000)).toBe("59:59");
  });

  it("показывает часы при часах > 0 (hh:mm:ss)", () => {
    expect(getHhMmSs(3_600_000)).toBe("01:00:00");
    expect(getHhMmSs(3_661_000)).toBe("01:01:01");
  });

  it("корректно работает для больших значений (часы могут быть > 24)", () => {
    expect(getHhMmSs(86_400_000)).toBe("24:00:00"); // 24 часа
    expect(getHhMmSs(100 * 3_600_000)).toBe("100:00:00"); // 100 часов
  });

  it("всегда падирует минуты и секунды до 2 знаков", () => {
    expect(getHhMmSs(5_000)).toBe("00:05");
    expect(getHhMmSs(300_000)).toBe("05:00");
    expect(getHhMmSs(3_661_000)).toBe("01:01:01");
  });

  it("не показывает блок часов, если часов 0", () => {
    expect(getHhMmSs(3_599_000)).toBe("59:59");
  });

  describe("опция alwaysShowHours", () => {
    it("добавляет блок часов, даже если часов 0", () => {
      expect(getHhMmSs(5_000, { alwaysShowHours: true })).toBe("00:00:05");
      expect(getHhMmSs(65_000, { alwaysShowHours: true })).toBe("00:01:05");
      expect(getHhMmSs(3_599_000, { alwaysShowHours: true })).toBe("00:59:59");
    });

    it("не влияет, если часы уже есть", () => {
      expect(getHhMmSs(3_600_000, { alwaysShowHours: true })).toBe("01:00:00");
      expect(getHhMmSs(3_661_000, { alwaysShowHours: true })).toBe("01:01:01");
    });

    it("корректно работает при нуле", () => {
      expect(getHhMmSs(0, { alwaysShowHours: true })).toBe("00:00:00");
    });
  });
});
