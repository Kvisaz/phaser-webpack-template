export  type SimpleFlatData = Record<string, string|number|boolean>;

/**
 * Статический класс для хранения контекстных данных по ключу string
 *
 * 1. внимание  - key и data можно конкретно типизировтаь на уровне модуля
 * но импортировать эти типы из других модулей нельзя
 * цель такого подхода - максимально развязать код от лапши импортов
 * поддерживаем независимую совместимость!
 *
 * 2. Рекомендуется хранить только данные,
 *    ссылки на инстансы игровых объектов - запрещены
 * **/
export class GameContext {
    private static contextsMap: Record<string, SimpleFlatData | undefined> = {};

    /** запросить контекст целиком  **/
    static get<T extends SimpleFlatData>(key: string): T | undefined {
        const context = this.contextsMap[key];
        if (context == null) {
            console.warn(`${key}: set context before using`);
            return;
        }
        return context as T;
    }

    /** удалить контекст - допустим, если он теряет актуальность **/
    static reset(key: string) {
        delete this.contextsMap[key];
    }

    /** установить контекст, можно частичными полями  **/
    static set<T extends SimpleFlatData>(key: string, data: T) {
        this.contextsMap[key] = {
            ...data
        };
    }

    /** обновить контекст, можно частичными полями  **/
    static update<T extends SimpleFlatData>(key: string, data: Partial<T>) {
        this.contextsMap[key] = {
            ...this.contextsMap[key],
            ...data
        };
    }
}
