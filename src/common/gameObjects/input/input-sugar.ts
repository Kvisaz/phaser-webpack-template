import Pointer = Phaser.Input.Pointer;
import { GameObject } from "../../interfaces";
import { makeContainerInteractive } from "../../gameObjects";

type IObject = Phaser.GameObjects.GameObject & {
    getBounds(): Phaser.Geom.Rectangle;
};

type ClickProps = (e: Phaser.Input.Pointer, objectX: number, objectY: number) => unknown;

export function onClick(obj: IObject, fn: ClickProps, useHandCursor = true): IObject {
    const { width, height } = obj.getBounds();
    const hitArea = {
        x: 0,
        y: 0,
        width,
        height,
    };
    const hitAreaCallback = Phaser.Geom.Rectangle.Contains;
    const config: Phaser.Types.Input.InputConfiguration = {
        hitArea,
        hitAreaCallback,
        useHandCursor,
    };
    obj.on(Phaser.Input.Events.POINTER_DOWN, fn);
    obj.setInteractive(config);
    return obj;
}

export function onContainerClick(obj: Phaser.GameObjects.Container, fn: ClickProps, useHandCursor = true): IObject {
    obj.on(Phaser.Input.Events.POINTER_DOWN, fn);
    makeContainerInteractive(obj, useHandCursor);
    return obj;
}

export function onceClick(obj: IObject, fn: ClickProps, useHandCursor = true): IObject {
    obj.once(Phaser.Input.Events.POINTER_DOWN, fn);
    obj.setInteractive({
        useHandCursor,
    });
    return obj;
}

export function onDoubleClick(
    obj: GameObject,
    callback: (pointer: Pointer, objectClickX: number, objectClickY: number) => void,
    doubleClickDelay = 350,
) {
    const scene = obj.scene;
    let lastTime = 0;
    obj.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Pointer, objectClickX: number, objectClickY: number) => {
        const time = scene.time.now;
        const clickDelay = time - lastTime;
        lastTime = time;
        if (clickDelay > doubleClickDelay) return;
        callback(pointer, objectClickX, objectClickY);
    });
}

export function onOver(obj: IObject, fn: Function): IObject {
    obj.on(Phaser.Input.Events.POINTER_OVER, fn);
    obj.setInteractive();
    return obj;
}

export function onOut(obj: IObject, fn: Function): IObject {
    obj.on(Phaser.Input.Events.POINTER_OUT, fn);
    obj.setInteractive();
    return obj;
}
