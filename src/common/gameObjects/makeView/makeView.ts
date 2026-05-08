import {AlignObject} from '@kvisaz/phaser-sugar';

class ObjectBuilder {
    private scene?: Phaser.Scene;

    setScene(scene: Phaser.Scene) {
        this.scene = scene;
    };

    clear() {
        this.scene = undefined;
    }

    img({textureName, frameName}: { textureName: string, frameName?: string }) {
        if (this.scene == null) throw 'user only in scene';
        return this.scene.add.image( 0, 0, textureName, frameName);
    }

    nine({textureName, frameName, width, height, padding}: {
        textureName: string,
        frameName?: string,
        width?: number,
        height?: number,
        padding?: number
    }) {
        if (this.scene == null) throw 'user only in scene';
        return this.scene.add.nineslice(0, 0, textureName, frameName,
            width, height,
            padding, padding, padding, padding);
    }

    text({text, style = {}}: {
        text: string | number,
        style?: Phaser.Types.GameObjects.Text.TextStyle,
    }) {
        if (this.scene == null) throw 'user only in scene';
        return this.scene.add.text(0, 0, '' + text, style);
    }

    con<T extends Phaser.GameObjects.GameObject>(children: T[]){
        if (this.scene == null) throw 'user only in scene';
        return this.scene.add.container(0, 0, children);
    }

}

const reusableBuilder = new ObjectBuilder();

/** создает view
 * - которое можно использовать в цепочках макетирования
 * - либо обычный объект Phaser
 * - либо ArrayAlignObject (но для удобной работы можно и Phaser.Container
 * **/
export function makeView<T extends AlignObject>(scene: Phaser.Scene, make: (builder: ObjectBuilder) => T) {
    reusableBuilder.setScene(scene);
    const result = make(reusableBuilder);
    reusableBuilder.clear();
    return result;
}
