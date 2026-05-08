interface ISetContainerChildrenScaleProps {
    container: Phaser.GameObjects.Container;
    scaleX: number;
    scaleY?: number;
    exclude?: Phaser.GameObjects.GameObject[];
}

export function setContainerChildrenScale({
                                              container,
                                              scaleX,
                                              scaleY = scaleX,
                                              exclude = [],
                                          }: ISetContainerChildrenScaleProps): void {
    const excluded = new Set(exclude);

    container.list.forEach((child) => {
        if (excluded.has(child)) return;

        const scalable = child as Phaser.GameObjects.GameObject & {
            setScale?: (x: number, y?: number) => Phaser.GameObjects.GameObject;
        };
        scalable.setScale?.(scaleX, scaleY);
    });
}
