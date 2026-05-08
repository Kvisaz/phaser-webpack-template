/** Делает контейнер интерактивным по его реальным видимым границам. */
export function makeContainerInteractive(
    obj: Phaser.GameObjects.Container,
    useHandCursor = true,
): Phaser.GameObjects.Container {
    /**
     * getBounds возвращает видимую область контейнера в world-координатах.
     * Для hitArea нужны локальные координаты самого контейнера.
     */
    const bounds = obj.getBounds();
    const matrix = obj.getWorldTransformMatrix();

    /**
     * Переводим углы видимого прямоугольника обратно из world в local.
     * Берем все 4 угла, чтобы корректно пережить scale/rotation/parent container.
     */
    const topLeft = matrix.applyInverse(bounds.left, bounds.top);
    const topRight = matrix.applyInverse(bounds.right, bounds.top);
    const bottomLeft = matrix.applyInverse(bounds.left, bounds.bottom);
    const bottomRight = matrix.applyInverse(bounds.right, bounds.bottom);

    /** Собираем локальный bounding box из переведенных углов. */
    const left = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const right = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const top = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const bottom = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const width = right - left;
    const height = bottom - top;

    obj.setSize(width, height);

    /**
     * Phaser при проверке input сам добавляет displayOriginX/Y к локальной точке.
     * Поэтому hitArea надо хранить в координатах с таким же origin-сдвигом.
     */
    const hitArea = new Phaser.Geom.Rectangle(
        left + obj.displayOriginX,
        top + obj.displayOriginY,
        width,
        height,
    );

    /**
     * Если input уже был включен, setInteractive только включит старый InteractiveObject
     * и не пересоздаст hitArea. Поэтому обновляем существующий input напрямую.
     */
    if (obj.input) {
        obj.input.enabled = true;
        obj.input.hitArea = hitArea;
        obj.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
        obj.input.customHitArea = true;
        obj.input.cursor = useHandCursor ? "pointer" : false;
    } else {
        obj.setInteractive({
            hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor,
        });
    }

    return obj;
}
