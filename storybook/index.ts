import { StoryScene } from "./StoryScene";
import { stories } from "./stories";
import { IStory, IStoryListItem } from "./interfaces";
import { IPhaserConfig, phaserGameConfig } from "../src/config";


const config: IPhaserConfig = {
  ...phaserGameConfig,
  scene: [new StoryScene(StoryScene.name)],
};

const game = new Phaser.Game(config);

const storiesEl = document.getElementById("stories");
if (storiesEl == null) throw "no sidebar";
const titleEl = document.getElementById("gameTitle");

let prevStoryClose: () => void | undefined;
const runInGame = async (story: IStory, game: Phaser.Game) => {
  prevStoryClose?.();
  titleEl!.innerHTML = story.title;
  const scene = game.scene.getScene(StoryScene.name);
  prevStoryClose = await story.run(scene);
};

let storiesIndex = 0;
stories.forEach((story) => {
  if (story.run != null) {
    addStory(story as IStory, storiesEl, storiesIndex == 0);
    storiesIndex++;
  } else if (story.template === "titleDelimiter") {
    addStoryDelimiter(story, storiesEl);
  }
});

function addStory(story: IStory, storiesEl: HTMLElement, isStart: boolean) {
  const el = addElement({
    storyTag: "button",
    innerHtml: `${story.title}`,
    className: "story",
    parent: storiesEl,
  });
  el.addEventListener("click", () => runInGame(story, game).catch(console.warn));

  if (isStart) {
    setTimeout(() => {
      el.focus();
      runInGame(story, game).catch(console.warn);
    }, 500);
  }
}

function addStoryDelimiter(story: IStoryListItem, storiesEl: HTMLElement) {
  return addElement({
    storyTag: "div",
    innerHtml: `${story.title}`,
    className: "storyDelimiter",
    parent: storiesEl,
  });
}

interface IAddProps {
  storyTag: string;
  innerHtml: string;
  className: string;
  parent: HTMLElement;
}
function addElement({ storyTag, className, innerHtml, parent }: IAddProps) {
  const el = document.createElement(storyTag);
  el.innerHTML = innerHtml;
  el.classList.add(className);
  parent.append(el);
  return el;
}
