import { texturePacker } from "@assetpack/core/texture-packer";

export default {
  entry: './src-assets',
  output: './public/assets',
  assetSettings: [
    {
      files: ['atlas{tps}/*.*'],
      settings: {
        output: './public/assets/atlases',
      },
    },
  ],
  pipes: [
    /** https://pixijs.io/assetpack/docs/guide/pipes/texture-packer/  **/
    /** какого-то хера пакует прямо в корень **/
    texturePacker({
      texturePacker: {
        padding: 2,
        nameStyle: "relative",
        removeFileExtension: false,
      },
      resolutionOptions: {
        template: "@%%x",
        resolutions: { default: 1, low: 0.5 },
        fixedResolution: "default",
        maximumTextureSize: 4096,
      },
    })
  ],
};
