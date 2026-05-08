import { GameContext, SimpleFlatData } from "./GameContext";

interface IGameContextData extends SimpleFlatData {
  score: number;
  active: boolean;
  title: string;
}

const primaryKey = "game-context-primary";
const secondaryKey = "game-context-secondary";
const missingKey = "game-context-missing";

const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

afterEach(() => {
  GameContext.reset(primaryKey);
  GameContext.reset(secondaryKey);
  GameContext.reset(missingKey);
  warnSpy.mockClear();
});

afterAll(() => {
  warnSpy.mockRestore();
});

describe("GameContext", () => {
  it("warns and returns undefined for missing keys", () => {
    const context = GameContext.get<IGameContextData>(missingKey);

    expect(context).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(`${missingKey}: set context before using`);
  });

  it("stores and returns data by key", () => {
    const data: IGameContextData = {
      score: 10,
      active: true,
      title: "start",
    };

    GameContext.update<IGameContextData>(primaryKey, data);

    expect(GameContext.get<IGameContextData>(primaryKey)).toEqual(data);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("merges successive updates for the same key", () => {
    GameContext.update<IGameContextData>(primaryKey, {
      score: 10,
      active: true,
      title: "start",
    });
    GameContext.update<IGameContextData>(primaryKey, {
      title: "next",
    });

    expect(GameContext.get<IGameContextData>(primaryKey)).toEqual({
      score: 10,
      active: true,
      title: "next",
    });
  });

  it("keeps values isolated between keys", () => {
    GameContext.update<IGameContextData>(primaryKey, {
      score: 1,
      active: true,
      title: "primary",
    });
    GameContext.update<IGameContextData>(secondaryKey, {
      score: 99,
      active: false,
      title: "secondary",
    });

    expect(GameContext.get<IGameContextData>(primaryKey)).toEqual({
      score: 1,
      active: true,
      title: "primary",
    });
    expect(GameContext.get<IGameContextData>(secondaryKey)).toEqual({
      score: 99,
      active: false,
      title: "secondary",
    });
  });

  it("removes data after reset", () => {
    GameContext.update<IGameContextData>(primaryKey, {
      score: 5,
      active: false,
      title: "old",
    });

    GameContext.reset(primaryKey);

    const context = GameContext.get<IGameContextData>(primaryKey);

    expect(context).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(`${primaryKey}: set context before using`);
  });
});
