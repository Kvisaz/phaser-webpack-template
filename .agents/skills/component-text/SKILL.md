---
name: component-text
description: Use when creating or editing a localized Phaser text component in this project, especially components with localeMap translations, optional locale props, default text styling, Phaser CSS-to-text-style conversion, or anchor-based relayout after text changes.
---

# Component Text

## Контекст

Перед созданием или редактированием текстового компонента проверь:

- `src/logic/types.ts` — для типа `Locale`;
- `src/assets/locale/index.ts` — для `getCurrentLocale`;
- соседние компоненты в той же папке — для локального стиля импортов и реэкспортов;
- `docs/ai/code_rules.md` — для общих правил проекта.

## Форма Компонента

Создай небольшой компонент через наследование от `Phaser.GameObjects.Text`.

Он всегда имеет такие пропсы

```ts
interface IProps {
  scene: Phaser.Scene;
  locale?: Locale;
  anchor?: IBoundable;
}
```

Остальные по желанию заказчика

`Locale` импортируй как type из слоя `logic`, а `getCurrentLocale` — из `assets`, используя корректный относительный путь для текущей папки.

В файле компонента перед классом держи в таком порядке:

1. `IProps`;
2. локальный стиль текста;
3. неэкспортируемую константу с текстами и готовыми переводами.

Дефолтный стиль задавай прямо так, если пользователь не дал другой визуальный стиль:

```ts
const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Russo One",
  fontSize: "24px",
  lineSpacing: 0,
  color: "#FFFFFF",
  stroke: "rgba(0, 0, 0, 0.65)",
  strokeThickness: 3,
};
```

Тексты задавай через неэкспортируемую константу:

```ts
const textData = {
  localeMap: {
    en: "Gold",
    ru: "Золото",
  },
} as const;
```

Поля `localeMap` должны соответствовать поддерживаемым языкам и содержать сразу готовый перевод, а не ключ для дальнейшей локализации.

## Выбор Текста

Локаль вычисляй внутри компонента:

```ts
const locale = this.props.locale ?? getCurrentLocale();
this.setText(textData.localeMap[locale]);
```

Если текст может меняться, вынеси обновление текста в подходящий публичный или приватный метод компонента. Если компонент поддерживает `anchor`, после каждого изменения текста вызывай `this.layout()`.

## Anchor И Layout
Вызывай `layout()`:

- после создания текста;
- после каждого изменения текста;
- после изменения стиля или значения, которое может изменить bounds.

Если пользователь задал правила вроде `centerX 20, topIn 13`, реализуй их в `layout()` через `makeAlign` в указанном порядке:

```ts
import { makeAlign } from "@kvisaz/phaser-sugar";

/** Выравнивает текст относительно anchor. */
private layout(): void {
  const { anchor } = this.props;
  if (!anchor) {
    return;
  }

  makeAlign((align) => {
    align.anchor(anchor).centerX(this, 20).topIn(this, 13);
  });
}
```

## CSS В Phaser

Если пользователь вклеил CSS, переносить его в `Phaser.Types.GameObjects.Text.TextStyle` консервативно.

Частые соответствия:

- `font-family` -> `fontFamily`;
- `font-size` -> `fontSize`;
- `color` -> `color`;
- `line-height` -> `lineSpacing`, если нужно;
- `text-shadow` или outline/stroke-like параметры -> `stroke` и `strokeThickness`, только если это действительно нужно визуально.

Если в CSS задана обводка текста, увеличивай `strokeThickness` относительно CSS-значения, когда в Phaser нет способа рисовать stroke целиком снаружи. Практическая причина: Phaser рисует обводку по центру края глифа, из-за этого она визуально съедает заливку и выглядит тоньше/жестче, чем CSS-обводка снаружи.

## Комментарии

Следуй текущим правилам проекта:

- перед новыми функциями, методами и классами добавляй `/** ... */` на русском;
- в ключевых местах сложной верстки нескольких объектов, математических вычислений и сложных логических комбинаций добавляй `/** ... */` на русском.

Комментарии должны быть короткими и объяснять смысл, а не пересказывать код.

## Экспорты

Используй именованные экспорты.

Если компонент лежит в отдельной папке и соседний код импортирует компоненты через папку, добавь или обнови `index.ts`.

Не экспортируй локальный `textData` и локальный `textStyle`, пока у них нет реального внешнего потребителя.
