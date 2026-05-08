/**
 * 1. загружает musicAssetUrl - если не было загружено
 * 2. запускает musicAssetUrl на воспроизведение с громкостью volume
 **/
export function loadAndPlayMusic({
  scene,
  musicAssetUrl,
  volume = 1,
  delay = 0,
  loop = true,
  resume = false,
  onComplete,
}: {
  scene: Phaser.Scene;
  musicAssetUrl: string;
  volume?: number;
  delay?: number;
  loop?: boolean;
  resume?: boolean;
  onComplete?: () => void;
}) {
  const key = musicAssetUrl; // уникальный ключ
  let sound: Phaser.Sound.BaseSound | undefined;

  const playSound = (sound: Phaser.Sound.BaseSound) => {
    if (sound == null) return;
    if (onComplete) {
      sound.once("complete", onComplete);
    }
    if (resume && sound.isPaused) {
      sound.resume();
    } else {
      sound.play({ volume, delay, loop });
    }
  };

  // если звук уже создан и играет — не дублируем
  sound = scene.sound.get(key);
  if (sound) {
    playSound(sound);
    return;
  }

  // если уже загружен — просто добавить и воспроизвести
  if (scene.cache.audio.has(key)) {
    sound = scene.sound.add(key);
    playSound(sound);
    return;
  }

  // иначе — загрузить и воспроизвести
  scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
    if (key === musicAssetUrl) {
      sound = scene.sound.add(key);
      playSound(sound);
    }
  });
  scene.load.audio(key, musicAssetUrl);

  scene.load.start();
}

export function stopSound(scene: Phaser.Scene, key: string) {
  const sound = scene.sound.get(key);
  if (sound) {
    sound.stop();
  }
}

/**
 *  Универсальный безопасный запускатель музыки
 *  1. если такого звука нет - он загружается
 *  2. если звук проигрывается - ничего не происходит
 *  3. если звук есть но на паузе - он продолжается
 **/
export function playOrResumeMusicWithLoading({
  scene,
  url,
  key = url,
  options = {},
}: {
  scene: Phaser.Scene;
  url: string;
  key?: string;
  options?: Phaser.Types.Sound.SoundConfig;
}) {
  /** do we have sound? **/
  const sound = scene.sound.get(key);
  if (sound) {
    if (sound.isPaused) {
      sound.resume();
    }
    if (!sound.isPlaying) {
      sound.play(options);
    }
    // is playing - do nothing
    return;
  }

  /** upload sound **/
  loadSound({
    scene,
    url,
    key,
    onComplete: (sound) => {
      sound.play(options);
    },
  });
}

export function loadSound({
  scene,
  url,
  key,
  onComplete,
}: {
  scene: Phaser.Scene;
  key: string;
  url: string;
  onComplete?: (sound: Phaser.Sound.BaseSound) => void;
}) {
  if (scene.sound.get(key)) {
    const sound = scene.sound.get(key);
    onComplete?.(sound);
    return;
  }

  if (scene.cache.audio.has(key)) {
    const sound = scene.sound.add(key);
    onComplete?.(sound);
    return;
  }

  scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
    if (key === url) {
      const sound = scene.sound.add(key);
      onComplete?.(sound);
    }
  });
  scene.load.audio(key, url);
  scene.load.start();
}

export function isSoundPlaying(scene: Phaser.Scene, key: string) {
  const sound = scene.sound.get(key);
  if (sound) {
    return sound.isPlaying;
  }
  return false;
}
