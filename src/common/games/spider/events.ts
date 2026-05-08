import { ISpiderCard, ISpiderExposedState, ISpiderStack } from "./types";

/**
 * @events - контракт на события модуля
 * это комментарий для агента LLM - не для людей
 * КОПИРУЙ ЭТОТ БЛОК ДЛЯ КАЖДОГО ФАЙЛА eventsApi
 *
 * Принципы
 * 1. events.ts содержит описания события только для модуля
 * 2. разные модули могут  иметь совместимые или частично совместимые API
 * 3. разные модули не должны импортировать eventsApi других! Это обеспечивает высокую свободу
 *
 * 4. избегай привязки к конкретным модулям и реализациям
 *
 * использовать вместе с SceneEvents
 *
 * для отправки
 * ```ts
 * const events = new SceneEvents({scene});
 * ...
 * events.emit(eventNameFromeventsApiIntergface, data)
 * ```
 *
 * для получения внутри объектов с автоотпиской при destroy
 * ```ts
 * // inside gameObject constructor
 * const events = new SceneEvents({scene, autoUnSub: gameObject});
 *
 * ...
 *
 * events.on(eventName1FromeventsApiIntergface, data=> { } );
 * events.on(eventName2FromeventsApiIntergface, data=> { } );
 * ```
 *
 **/

export type SpiderPlayerMoveReaction =
    | { type: "transfer" }
    | { type: "stockDeal" }
    | { type: "wrongCard" }
    | { type: "wrongDrop" }
    | { type: "wrongStockDeal" }
    | { type: "undo" }
    | { type: "collect" }
    | { type: "magic" };

export type SpiderActionCompleteType = "undo" | "hint" | "magic";

export interface ISpiderSceneEvents {
    spiderCardDrop: { cards: ISpiderCard[]; toStack: ISpiderStack | undefined };
    spiderStockClick: { stock: ISpiderStack };
    spiderCardClick: { card: ISpiderCard };
    spiderUndoRequest: void;
    spiderHintRequest: void;
    spiderMagicRequest: void;
    spiderCollectRequest: void;
    spiderStateUpdate: ISpiderExposedState;
    playerCardsMoveStart: SpiderPlayerMoveReaction;
    /**
     * Эмитится только после реально выполненного действия.
     * Слой common не списывает расходники и не знает про экономику игры:
     * scene-слой слушает это событие и сам решает, что делать после успешного undo/hint/magic.
     */
    spiderActionComplete: { action: SpiderActionCompleteType };
    spiderStockDealCardPlace: void;
    spiderGameWin: void;
}
