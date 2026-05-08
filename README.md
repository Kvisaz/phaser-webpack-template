# Phaser Webpack Template

v.1.3.0

Webpack-шаблон для Phaser 3 игр с TypeScript, быстрым dev-сервером, генерацией
атласов, автоконфигом ассетов и общей библиотекой игровых утилит.

- [GitHub](https://github.com/Kvisaz/phaser-webpack-template)
- [Changelog](./changelog.md)

## Стек

- Phaser 3.90.0
- TypeScript 5.9
- Webpack 5 + esbuild-loader
- Prettier
- Jest / ts-jest
- free-tex-packer-core для атласов
- `@kvisaz/phaser-sugar`
- `phaser3-rex-plugins`
- опциональные Yandex Games helpers
- опциональный Storybook

## Быстрый старт

```zsh
npm install
npm run start
```

Для production-сборки:

```zsh
npm run typecheck
npm run build
```

## Скрипты

- `npm run start` - dev-сервер Webpack.
- `npm run build` - production-сборка в `dist`.
- `npm run typecheck` - проверка TypeScript без сборки.
- `npm run atlas` - сборка атласов из `src_assets/atlas`.
- `npm run assets` - генерация `src/autoAssetsConfig.ts`.
- `npm run yandex` - production-сборка и запуск Yandex SDK dev proxy.
- `npm run yandex-dev-mode` - то же, что `npm run yandex`.
- `npm run storybook` - опциональный ручной запуск Storybook.

## Ассеты

Готовые ассеты живут в `public/assets`. Файлы из `public` доступны в игре по
относительным путям, например `./assets/images/example.png`.

Исходники атласов живут в `src_assets/atlas`. По умолчанию `atlas.js` собирает
атлас `main` из `src_assets/atlas/main` и пишет результат в
`public/assets/atlases`.

```zsh
npm run atlas
npm run assets
```

`src/autoAssetsConfig.ts` - автогенерируемый файл. Не редактируй его вручную:
меняй файлы в `public/assets`, затем запускай `npm run assets`.

При необходимости можно добавить локальный `assets.config.js`; `assets-config.js`
подхватит его и переопределит стандартные пути, расширения и target-файл.

## Общая библиотека

`src/common` содержит переиспользуемые модули для Phaser-проектов:

- коллекции, математику, строки, время и async helpers;
- typed events и безопасные подписки;
- базовые UI-компоненты и Phaser game objects helpers;
- эффекты, частицы, floating text и object pools;
- scene helpers и game-core;
- сервисы для локального/Yandex-хранилища, рекламы, платформы и локализации;
- карточные игровые модули для Klondike/Spider и общие card abstractions.

## AI / Agent Notes

В репозитории есть `AGENTS.md`, `.agents/skills` и `docs/ai`. Они описывают
локальные правила работы с проектом, код-стиль, ревью, ассеты, компоненты,
сцены и финальные проверки.

## Storybook

Storybook оставлен как дополнительный ручной инструмент для разработки и
демонстрации UI/scene-компонентов. Он не нужен для обычного запуска,
typecheck или production-сборки игры. Сборка Storybook в `docs` выполняется
только вручную, вне стандартных npm scripts.

## Почему Webpack

Шаблон держит Phaser как статический asset и использует `esbuild-loader` для
быстрой компиляции TypeScript. Это дает предсказуемую сборку Webpack и быстрый
цикл разработки без бандлинга самого Phaser в основной game bundle.
