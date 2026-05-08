interface IBoundable {
  getBounds(output?: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle;
}

type Point = [number, number];

interface IArgs {
  scene: Phaser.Scene;
  objects: IBoundable[];
  width: number;
  colorInt: number;
}

/**
 *  Идея была в том, чтобы соединять объекты на карте красивой плавной кривой
 *  по факту этот алгоритм из коробки у Фазера создает ломаную линию для точек
 *  на близких дистанциях
 *
 *  в примере все красиво
 *  https://labs.phaser.io/edit.html?src=src%5Cgame%20objects%5Cshapes%5Cspline.js&v=dev
 * **/
export function createCurveForObjects({ scene, objects, colorInt, width }: IArgs): Phaser.GameObjects.Curve {
  const points: Point[] = objects.map((obj) => {
    const bounds = obj.getBounds();
    return [bounds.centerX, bounds.centerY];
  });

  console.log('points', points);

  const spline = new Phaser.Curves.Spline(points);
  const curve = new Phaser.GameObjects.Curve(scene, 100, 100, spline);
  // const curve = scene.add.curve(100, 100, spline);
  curve.setStrokeStyle(width, colorInt);
  return curve;
}
