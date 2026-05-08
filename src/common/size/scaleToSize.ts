export interface IScaling {
  scene: Phaser.Scene | null;
  scaleX: number;
  scaleY: number;

  getBounds(): Phaser.Geom.Rectangle;

  setScale(x: number, y?: number): this;
}

interface IProps {
  gameObject: IScaling;
  width: number;
  height: number;
  cover?: boolean;
}

/** scale gameObject (increase or decrease) to target width, height **/
export const scaleToSize = ({ gameObject, height, width, cover }: IProps) => {
  const { width: currentWidth, height: currentHeight } = gameObject.getBounds();

  const scaleX = width / currentWidth;
  const scaleY = height / currentHeight;

  const scale = cover ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

  gameObject.setScale(gameObject.scaleX * scale, gameObject.scaleY * scale);
};

/** fill size proportionally - use it for backgrounds **/
export const coverToSize = ({ gameObject, height, width }: IProps) => {
  return scaleToSize({ gameObject, height, width, cover: true });
};

/** decrease to target width, height only if gameObject is bigger then it  **/
export const fitToSize = ({ gameObject, height, width }: IProps) => {
  const { width: currentWidth, height: currentHeight } = gameObject.getBounds();

  if (currentWidth <= width && currentHeight <= height) return;

  const scaleX = width / currentWidth;
  const scaleY = height / currentHeight;
  const scale = Math.min(scaleX, scaleY);

  gameObject.setScale(gameObject.scaleX * scale, gameObject.scaleY * scale);
};

/** decrease to scene width, height only if gameObject is bigger then it
 *  sceneK allow to adapt object to k of scene size
 **/
export const fitToSceneSize = (gameObject: IScaling, sceneK = 1) => {
  const scene = gameObject.scene;
  if (scene == null) {
    console.warn("fitToVisibleSceneSize: scene==null", gameObject);
    return;
  }

  const width = scene.scale.width * sceneK;
  const height = scene.scale.height * sceneK;
  fitToSize({ gameObject, width, height });
};

/** scale to scene width, height
 *  sceneK allow to adapt object to k of scene size
 **/
export const scaleToSceneSize = (gameObject: IScaling, sceneK = 1) => {
  const scene = gameObject.scene;
  if (scene == null) {
    console.warn("fitToVisibleSceneSize: scene==null", gameObject);
    return;
  }

  const width = scene.scale.width * sceneK;
  const height = scene.scale.height * sceneK;
  scaleToSize({ gameObject, width, height });
};
