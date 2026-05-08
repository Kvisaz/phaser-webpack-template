type unSub = () => void;
type Sub<T> = (data: T) => void;

export interface ISubscribeSceneArgs<T> {
    eventEmitter: Phaser.Events.EventEmitter;
    eventName: string;
    on: Sub<T>;
    /** ограничитель действия, по сути доп префикс **/
    scope?: string;
    once?: boolean;
    autoUnSub?: Phaser.GameObjects.GameObject;
}

export const normalizeEventName = (eventName: string, scope?: string) => (
    scope ? `${scope}.${eventName}` : eventName
);

/** @deprecated используй SceneEvents
 * Типизированная подписка на события эмиттера **/
export function typedSub<T>({eventEmitter, eventName, scope, on, once, autoUnSub}: ISubscribeSceneArgs<T>): unSub {
    const normalizedEventName = normalizeEventName(eventName, scope);
    let isUnSubscribed = false;

    let callback: Sub<T>;
    const unSub = () => {
        if (isUnSubscribed) return;
        isUnSubscribed = true;
        eventEmitter.off(normalizedEventName, callback);
        autoUnSub?.off(Phaser.GameObjects.Events.DESTROY, unSub);
    }
    callback = once ? (data) => {
        try {
            on(data);
        } finally {
            unSub();
        }
    } : on;

    if (once) eventEmitter.once(normalizedEventName, callback);
    else eventEmitter.on(normalizedEventName, callback);

    autoUnSub?.once(Phaser.GameObjects.Events.DESTROY, unSub);

    return unSub;
}

export interface IEmitSceneArgs<T> {
    eventEmitter: Phaser.Events.EventEmitter;
    eventName: string;
    data: T;
    /** ограничитель действия, по сути доп префикс **/
    scope?: string;
}

/** Типизированная отправка событий эмиттера **/
export function typedEmit<T>({eventEmitter, eventName, scope = '', data}: IEmitSceneArgs<T>): void {
    const normalizedEventName = normalizeEventName(eventName, scope);
    eventEmitter.emit(normalizedEventName, data);
}
