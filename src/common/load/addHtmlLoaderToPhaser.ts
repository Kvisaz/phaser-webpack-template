interface IProps {
  scene: Phaser.Scene;
  /**  id элемента который содержит переменную **/
  loaderVarHosId: string;
  /** CSS переменная, всегда с -- префиксом **/
  cssVarProgressName?: string;
}

/** Find and change CSS vars --progress in html loader or html loader parent **/
export const addHtmlLoaderToPhaser = ({ scene, loaderVarHosId, cssVarProgressName = "--progress" }: IProps) => {
  const loaderElement = document.getElementById(loaderVarHosId);
  if (loaderElement == null) {
    console.warn("no loader element");
    return;
  }
  const setProgress = (progress: number) => {
    loaderElement.style.setProperty(cssVarProgressName, `${progress}`);
  };

  const removeLoader = ()=>{
    loaderElement.style.setProperty('display', 'none');
  }

  scene.load.on("progress", setProgress);
  scene.load.on("complete", (progress: number) => {
    setProgress(1);
    removeLoader();
  });
};
