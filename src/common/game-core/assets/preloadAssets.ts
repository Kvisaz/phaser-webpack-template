import { loadAssets, loadFont } from "@kvisaz/phaser-sugar";
import { IAssets } from "./types";

export const preloadAssets = (scene: Phaser.Scene, assets: Readonly<IAssets>, isLogging=false) => {
  const imageSet = new Set(assets.images);
  const soundSet = new Set(assets.sounds);
  const atlasSet = new Set(assets.atlases);
  const fontSet = new Set(assets.fonts);

  function log(...args: unknown[]){
    if(!isLogging) return;
    console.log(...args);
  }

  imageSet.forEach(image => {
    if (scene.textures.exists(image.name)) return;
    log("preload single image", image.name, image.url);
    scene.load.image(image.name, image.url);
  });

  soundSet.forEach(sound => {
    if (scene.cache.audio.exists(sound.name)) return;
    log("preload sound", sound);
    scene.load.audio(sound.name, sound.url);
  });

  atlasSet.forEach(atlas => {
    if (scene.textures.exists(atlas.pngUrl)) return;
    log("preload atlas", atlas);
    scene.load.atlas(atlas.pngUrl, atlas.pngUrl, atlas.jsonUrl);
  });

  fontSet.forEach(font => {
    log("font.fontFamily", font.fontFamily);
    loadFont({
      scene, fontFamily: font.fontFamily, url: font.url
    });
  });
};

export const asyncPreloadAssets = (scene: Phaser.Scene, assets: Readonly<IAssets>, onProgress?: (percent: number) => void): Promise<void> => {
  return loadAssets(scene, scene => {
    preloadAssets(scene, assets);
  }, onProgress);
};
