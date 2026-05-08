interface IProps {
    fromScene: Phaser.Scene;
    key: string;
    toScene: Phaser.Scene;
    data?: object;
}

/** запустиь абсолютно новую сцену, которой нет в конфиге **/
export const goScene = ({fromScene, key, toScene, data}: IProps) => {
    const sceneManager = fromScene.scene;
    const alreadyAdded = sceneManager.get(key) as Phaser.Scene | undefined;
    if (!alreadyAdded) {
        sceneManager.add(key, toScene, false, data);
    }
    sceneManager.start(key, data);
};
