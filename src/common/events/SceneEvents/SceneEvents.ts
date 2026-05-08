import {SafeSceneEventsAdapter} from '../SafeSceneEventsAdapter';

interface IProps {
    scene: Phaser.Scene,
    /**
     * указывать для объектов которые подписываются
     * при их destroy их экземпляр для доступа к эвентам сцены будет отписываться
     * **/
    autoUnSub?: Phaser.GameObjects.GameObject
}

/**
 *  Адаптер для типизированной работы с событиями сцены
 *
 *  - Располагайте в конструкторе!
 *    В конструкторе есть сайд-эффект "отписка от моих эвентов при shutdown сцены"
 *  - на destroy класса - вешайте unSubscribeAll
 *  - ИЛИ указывается в props autoUnSub игровой объект который разрушится
 *
 *
 *  Типизация эвентов - пример
 *
 *  ```
 *  export interface IMyComponentEvents {
 *     onClick: { id: string },
 *     onHover: { id: string }
 * }
 *  ```
 **/
export class SceneEvents<TypedEvents extends object> extends SafeSceneEventsAdapter<TypedEvents> {
    constructor(private props: IProps) {
        super(props.scene);
        props.autoUnSub?.on(Phaser.GameObjects.Events.DESTROY, () => this.unSubscribeAll());
    }
}
