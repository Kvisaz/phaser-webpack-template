import { ClassicRussianScorer } from "./ClassicRussianScorer";
import { KlondikeStackType, KlondikeGameMove } from "../types";

const scorer = new ClassicRussianScorer({});

const stack = (type: KlondikeStackType) => ({ type } as any);

describe("ClassicRussianScorer", () => {
  it("штрафует за перелистывание колоды", () => {
    const move: KlondikeGameMove = { type: "deckRecycle", data: { deck: stack(KlondikeStackType.DECK), grave: stack(KlondikeStackType.GRAVE) } as any };
    expect(scorer.scoreMove(move)).toBe(-20);
  });

  it("начисляет очки за перенос со стола на базу и открытие карты", () => {
    const move: KlondikeGameMove = {
      type: "transfer",
      data: {
        cards: [] as any,
        from: stack(KlondikeStackType.PILE),
        to: stack(KlondikeStackType.BASE),
        openedPileCard: {} as any,
      },
    };

    // +10 за базу, +5 за открытую карту
    expect(scorer.scoreMove(move)).toBe(15);
  });

  it("дает очки за перенос из сброса на базу", () => {
    const move: KlondikeGameMove = {
      type: "transfer",
      data: {
        cards: [] as any,
        from: stack(KlondikeStackType.GRAVE),
        to: stack(KlondikeStackType.BASE),
      },
    };

    expect(scorer.scoreMove(move)).toBe(10);
  });

  it("штрафует за снятие карты с базы на стол", () => {
    const move: KlondikeGameMove = {
      type: "transfer",
      data: {
        cards: [] as any,
        from: stack(KlondikeStackType.BASE),
        to: stack(KlondikeStackType.PILE),
      },
    };

    expect(scorer.scoreMove(move)).toBe(-15);
  });

  it("не начисляет очки за бесполезный перенос между столами", () => {
    const move: KlondikeGameMove = {
      type: "transfer",
      data: {
        cards: [] as any,
        from: stack(KlondikeStackType.PILE),
        to: stack(KlondikeStackType.PILE),
      },
    };

    expect(scorer.scoreMove(move)).toBe(0);
  });

  it("магический перенос на базу дает очки", () => {
    const move: KlondikeGameMove = {
      type: "magic",
      data: {
        card: {} as any,
        from: stack(KlondikeStackType.PILE),
        to: stack(KlondikeStackType.BASE),
        durationMs: 0,
        fromIndex: 0,
      },
    };

    expect(scorer.scoreMove(move)).toBe(10);
  });

  it("магический перенос с базы на стол не приносит выгоды (штраф/нулевой результат)", () => {
    const move: KlondikeGameMove = {
      type: "magic",
      data: {
        card: {} as any,
        from: stack(KlondikeStackType.BASE),
        to: stack(KlondikeStackType.PILE),
        durationMs: 0,
        fromIndex: 0,
      },
    };

    expect(scorer.scoreMove(move)).toBeLessThanOrEqual(0);
  });
});
