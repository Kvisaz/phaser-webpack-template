---
name: asset-audit
description: Use when checking Phaser asset keys, generated assets, preload usage, missing files, unused assets, or broken asset references.
---

Проверь ассеты проекта.

Шаги:

1. Найди manifest, generated summary или builder-код ассетов.
2. Найди preload-код.
3. Найди использования `image`, `sprite`, `atlas`, `audio` и других asset keys.
4. Сравни ключи с реальными файлами и manifest.
5. Не меняй ассеты вручную без запроса пользователя.
6. Не запускай браузер, dev server или проверки без прямой просьбы пользователя.

Формат результата:

```md
## Missing

- `key` - где используется, чего не хватает.

## Unused

- `key` - где объявлен, почему выглядит неиспользуемым.

## Mismatches

- файл
- ключ
- проблема
- точная правка
```
