/** Говорит анимации быть законченной.
 * в OnComplete анимации должен быть предусмотрен корректный результат для финиша
 * Потенциально опасный метод для сложных композиций анимаций,
 * если ставить анимацию в onComplete - finishAnimation вызовет рекурсию
 * **/
export const finishAnimation = (gameObject: Phaser.GameObjects.GameObject): void => {
  const tweens = gameObject.scene?.tweens.getTweensOf(gameObject);
  if (!tweens) return;

  for (const tween of tweens) {
    tween.complete(0);
  }
};
