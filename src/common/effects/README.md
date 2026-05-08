# Common Effects Usage

`src/common/effects` содержит низкоуровневые визуальные эффекты без знания о сценах игры, магазинах, деньгах или loot-логике.

## Базовый паттерн

1. Создать слой-контейнер в сцене.
2. Создать пулы объектов один раз на время жизни слоя.
3. На каждое событие запускать короткий effect-класс.
4. На destroy слоя уничтожить активные эффекты и пулы.

```ts
import {
  FloatingTextEffect,
  ImageBurstEffect,
  ImageEffectPool,
  ParticleEffectLayer,
  TextEffectPool,
} from "../../common";

const layer = scene.add.container(0, 0);
layer.setDepth(10000);

const coinPool = new ImageEffectPool({
  scene,
  parent: layer,
  asset: {
    url: "coin40",
    frameName: "coin40.png",
  },
  initialSize: 12,
});

const textPool = new TextEffectPool({
  scene,
  parent: layer,
  initialSize: 3,
});
```

## Phaser particle layer

`ParticleEffectLayer` - общий event-driven слой для Phaser `ParticleEmitter`. Он не хранит asset set внутри себя: набор спрайтов передается в событии запуска.

```ts
const particleLayer = new ParticleEffectLayer({scene});

sceneEvents.emit("startParticleEffect", {
  particleSet: {
    assets: [
      {
        url: "particleAtlas",
        frameName: "particle.png",
      },
    ],
  },
  presetName: "cannonLeft",
  repeatIntervalMs: 600,
  quantity: 24,
  emitters: [
    {
      base: "cannonLeft",
      origin: {x: 24, y: 320},
      startDelayMs: 0,
    },
  ],
});
```

Держи конкретные asset sets рядом с местом использования: story, scene или feature config. `src/common/effects` должен содержать только общую механику, типы и абстрактные настройки движения.

`presetName: "protonFireworks"` запускает цепочку emitter-ов по схеме Proton fireworks: root-частицы вылетают снизу, `onEmit` создает follow-emitter, а `onDeath` создает один из burst-emitter-ов. Его можно запускать тем же событием, передав `particleSet`, `presetName` и при необходимости `durationMs`. Параметры дочерних emitter-ов меняются через `cascadeOverrides` по `id` action-а; это не влияет на количество root-частиц.

```ts
sceneEvents.emit("startParticleEffect", {
  particleSet,
  presetName: "protonFireworks",
  origin: {x: 0, y: scene.scale.height + 24},
  centerX: scene.scale.width / 2,
  width: scene.scale.width,
  lifespan: {min: 2200, max: 3000},
  cascadeOverrides: {
    denseBurst: {quantity: 12},
    softBurst: {quantity: 12},
  },
});
```

Cascade preset состоит из `root`, `onEmit` и `onDeath`. `followEmitter` подходит для следа за живой root-частицей, `explodeEmitter` - для одноразового burst-а в точке смерти root-частицы.

## Разлет частиц с гравитацией

`ImageBurstEffect` подходит для траты денег, искр, осколков и других коротких burst-эффектов.

Частицы не замирают в конце: каждая получает стартовую скорость и падает под `gravity`.

```ts
let effect: ImageBurstEffect;
const clickPoint = {x: pointer.worldX, y: pointer.worldY};

effect = new ImageBurstEffect({
  scene,
  asset: {
    url: "coin40",
    frameName: "coin40.png",
  },
  pool: coinPool,
  startPoint: clickPoint,
  config: {
    amount: 8,
    scaleMin: 0.3,
    scaleMax: 0.48,
    scaleMultiplier: 2,
    speedMin: 190,
    speedMax: 440,
    gravity: 820,
    duration: 900,
    fadeStartK: 0.58,
    angleStart: 205,
    angleEnd: 335,
  },
  onComplete: () => {
    activeEffects.delete(effect);
  },
});

activeEffects.add(effect);
```

Все поля `config` у `ImageBurstEffect` опциональны. Если нужно изменить только гравитацию и размер:

```ts
new ImageBurstEffect({
  scene,
  asset: coinAsset,
  pool: coinPool,
  startPoint,
  config: {
    scaleMultiplier: 2,
    gravity: 900,
  },
});
```

## Всплывающий текст

`FloatingTextEffect` показывает текст, двигает его по скорости и возвращает объект в `TextEffectPool`.

```ts
let textEffect: FloatingTextEffect;
const clickPoint = {x: pointer.worldX, y: pointer.worldY};

textEffect = new FloatingTextEffect({
  scene,
  pool: textPool,
  config: {
    text: "-300",
    startPoint: clickPoint,
    velocityX: 0,
    velocityY: -95,
    duration: 920,
    scaleFrom: 0.92,
    scaleTo: 1.08,
    style: {
      fontFamily: "\"Russo One\", Roboto, Verdana, sans-serif",
      fontSize: "38px",
      color: "#ff4a4a",
      stroke: "#5a0000",
      strokeThickness: 6,
      align: "center",
    },
  },
  onComplete: () => {
    activeEffects.delete(textEffect);
  },
});

activeEffects.add(textEffect);
```

## Полет частиц к цели

`ImageFlyEffect` нужен для получения награды: монеты появляются в `startPoint`, немного разлетаются, потом летят к `targetPoint`.

```ts
import {ImageFlyEffect} from "../../common";

let flyEffect: ImageFlyEffect;

flyEffect = new ImageFlyEffect({
  scene,
  asset: coinAsset,
  pool: coinPool,
  startPoint: {x: clickX, y: clickY},
  targetPoint: {x: counterX, y: counterY},
  config: {
    amount: 10,
    scaleMin: 0.35,
    scaleMax: 0.55,
    burstDistance: 45,
    burstDuration: 180,
    flyStepMs: 35,
    flyDurationMin: 450,
    flyDurationMax: 850,
    arcHeightMin: 80,
    arcHeightMax: 210,
    arcHeightK: 0.24,
  },
  onComplete: () => {
    activeEffects.delete(flyEffect);
  },
});

activeEffects.add(flyEffect);
```

## Cleanup

Слой-владелец должен хранить активные эффекты и чистить их до уничтожения пулов.

```ts
const activeEffects = new Set<{destroy: () => void}>();

function destroyEffects(): void {
  activeEffects.forEach((effect) => effect.destroy());
  activeEffects.clear();

  coinPool.destroy();
  textPool.destroy();
  layer.destroy();
}
```

## Правила

- Пулы создаются на слой или фичу, а не на каждый клик.
- Effect-класс создается на каждый запуск и сам возвращает объекты в пул.
- Для штатного cleanup используется `killTweensOf`, не `complete`, чтобы не вызывать `onComplete` повторно.
- Если эффект должен слушать game events, делай отдельный слой в `src/scenes/shared`, а не добавляй scene-логику в `src/common/effects`.
- Координаты для общих эффектов передавай в координатах сцены, если слой стоит в `(0, 0)`.
