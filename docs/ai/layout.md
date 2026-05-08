# Верстка в Phaser 3.90

## класс Align для позиционирования объектов относительно друг друга и на сцене

Для верстки объектов относительно друг друга или сцены - класс Align, который импортируется из '@kvisaz/phaser-sugar'. Его базовая концепция - anchor - объект или сцена, относительно которого происходит позиционирование.

anchor никогда не двигается в момент операции, двигаются все остальные

```typescript
import { Align } from "@kvisaz/phaser-sugar";

let scene: Phaser.Scene;
let obj1: Phaser.GameObjects.GameObject;
let obj2: Phaser.GameObjects.GameObject;
let obj3: Phaser.GameObjects.GameObject;

// создаем класс, если анкор заранее не известен
const align = new Align();

// создаем класс, если анкор известен
// const align = new Align(obj);

// центрируем объект obj2 по obj1, который не двигается
align.anchor(obj1).center(obj2);
// другие методы центрирования
align.anchor(obj1).centerX(obj2);
align.anchor(obj1).centerY(obj2);

// все методы Align возвращают ссылку на него, что позволяет использовать цепочечный синтаксис
align
  .anchor(obj1)
  .centerY(obj2) // тут выравниваем obj2 по obj1
  .anchor(obj2)
  .leftTo(obj3)
  .centerX(obj3); // а тут по выравненному obj2 - позиционируем obj3

// короткий синтаксис - не сохраняем align в переменную, если не нужно переиспользование
new Align(obj1).centerY(obj2).anchor(obj2).leftTo(obj3).centerX(obj3);
```

Методы Align:

- anchor(item: ISizeable): this - анкор на объект
- anchorSceneScreen(scene: Phaser.Scene): this - анкор на сцену
- center(item: AlignObject, oX = 0, oY = 0): this - выравнивание по всем осям со смещением, смещение всегда слева направо и сверху вниз
- centerX(item: AlignObject, oX = 0): this
- centerY(item: AlignObject, oY = 0): this
- bottomIn(item: AlignObject, oY = 0): this - нижняя граница объекта должна совпасть с нижней границей анкора
- topIn(item: AlignObject, oY = 0): this - верхняя граница объекта должна совпасть с верхней границей анкора
- leftIn(item: AlignObject, oY = 0): this - аналогично для левых границ
- rightIn(item: AlignObject, oY = 0): this - аналогично для правых границ
- bottomTo(item: AlignObject, oY = 0): this - объект снизу, верхняя граница объекта должна совпасть с нижней границей анкора
- topIn(item: AlignObject, oY = 0): this - объект сверху, нижняя граница объекта должна совпасть с верхней границей анкора
- leftIn(item: AlignObject, oY = 0): this - объект слева, правая граница объекта должна совпасть с левой границей анкора
- rightIn(item: AlignObject, oY = 0): this - объект справа, левая граница объекта должна совпасть с правой границей анкора

Параметр oX, oY - это смещение по соответствующей оси, всегда отсчитывается слева направо или сверху вниз. Параметры опциональны и по умолчанию равны 0.

Пример - позиционируем кнопки сложности по центру и друг за другом по вертикали

```typescript
// Position buttons using Align chain
new Align(bg) // бэкграунд - объект на вест экран
  .center(mediumButton)
  .anchor(mediumButton)
  .topTo(easyButton, -buttonGap)
  .centerX(easyButton)
  .bottomTo(hardButton, buttonGap)
  .centerX(hardButton);
```

## ArrayAlignObject и его сиблинги

`ArrayAlignObject` — это обертка над массивом `AlignObject`, которая ведет себя как один объект для `Align`:
- имеет `getBounds()`;
- можно двигать целиком;
- удобно центрировать всю собранную композицию одной операцией.

Базовый вход:
- `arrayAlign.alignObject(objects)` — создать `ArrayAlignObject` из массива объектов.

Сиблинги в `arrayAlign`:
- `arrayAlign.row(objects, gap)` — выстроить объекты в ряд (слева направо).
- `arrayAlign.column(objects, gap)` — выстроить объекты в колонку (сверху вниз).
- `arrayAlign.rowReverse(objects, gap)` — ряд справа налево.
- `arrayAlign.columnReverse(objects, gap)` — колонка снизу вверх.
- `arrayAlign.chain(...)` — произвольная цепочка выравнивания.

Сиблинги в `arrayLayout`:
- `layoutRow({...})` — row-верстка с детальными оффсетами/правилами.
- `layoutColumn({...})` — column-верстка с детальными оффсетами/правилами.
- `layoutChain({...})` — самый гибкий вариант.

Рекомендуемый паттерн для сложной композиции:
1. Сначала выравниваем локальные элементы относительно друг друга (`Align`).
2. Локальные группы оборачиваем в `arrayAlign.alignObject(...)`.
3. Из групп собираем общую композицию (`row/column` или `layoutRow/layoutColumn`).
4. Центрируем итоговый `ArrayAlignObject` относительно сцены.

Пример:

```typescript
import { Align, arrayAlign } from "@kvisaz/phaser-sugar";

const align = new Align();

align.anchor(cardA).topTo(labelA, 24).centerX(labelA);
align.anchor(cardB).topTo(labelB, 24).centerX(labelB);

const leftBlock = arrayAlign.alignObject([labelA, cardA]);
const rightBlock = arrayAlign.alignObject([labelB, cardB]);

const row = arrayAlign.alignObject(arrayAlign.row([leftBlock, rightBlock], 120));
align.anchorSceneScreen(scene).center(row);
```
