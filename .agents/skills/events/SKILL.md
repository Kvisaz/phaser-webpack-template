---
name: event-bus
description: Use when adding, changing, reviewing, or debugging SceneEvents, event payloads, local events.ts files, or request/response event flows.
---

Для событий используй `SceneEvents<...>`.

Правила:

1. Код под `src/scenes` использует `IGameEvents` из `src/events`.

2. Код в `src/common` объявляет локальный `events.ts` внутри модуля.

3. Локальные `events.ts` и связанные типы нельзя экспортировать через `index.ts`.

4. Если другому модулю нужен совместимый event API, объяви локальный интерфейс с теми же event names и payload.

5. Если объект умеет `destroy`, передавай `autoUnSub`.

6. Для запроса данных через events используй пару:
   - `requestX`
   - `responseX`

7. На стороне отправителя сначала подпишись на `responseX`, потом делай `emit("requestX", data)`.

8. На стороне приемника слушай `requestX` и в обработчике эмить `responseX`.

9. `requestId` добавляй только если реально возможны несколько одновременных одинаковых запросов с одним и тем же `responseX`.

10. Не импортируй чужой локальный `events.ts`.

11. Не используй ссылочную типизацию вида `SomeType["field"]`, кроме разрешенного приведения внутри `switch case`.

Пример локального события:

```typescript
export interface ICardThemeControlsEvents {
  cardThemeFaceChange: { faceAssetName: "chibi" | "classic" };
}
```

Пример отправки:

```typescript
const events = new SceneEvents<ICardThemeControlsEvents>({ scene });
events.emit("cardThemeFaceChange", { faceAssetName: "classic" });
```

Пример подписки:

```typescript
export interface IGamePlayCardEvents {
  cardThemeFaceChange: { faceAssetName: "chibi" | "classic" };
}

const events = new SceneEvents<IGamePlayCardEvents>({ scene, autoUnSub: this });

events.on("cardThemeFaceChange", (data) => {
  this.setFaceTheme(data.faceAssetName);
});
```

Пример request/response:

```typescript
export interface ICardInfoRequesterEvents {
  requestCardInfo: { cardId: string };
  responseCardInfo: { cardId: string; title: string; cost: number };
}

const events = new SceneEvents<ICardInfoRequesterEvents>({ scene, autoUnSub: this });

events.once("responseCardInfo", (data) => {
  if (!data) {
    return;
  }

  this.showCardInfo(data);
}, 3000);

events.emit("requestCardInfo", { cardId: "card-1" });
```
