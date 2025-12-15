import { StoryScene } from "./StoryScene";
import { stories } from "./stories";
import { IStory, IStoryListItem } from "./interfaces";
import { IPhaserConfig, phaserGameConfig } from "../src/config";


const config: IPhaserConfig = {
  ...phaserGameConfig,
  scale: {
    ...phaserGameConfig.scale,
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NONE,
  },
  scene: [new StoryScene(StoryScene.name)],
};

const game = new Phaser.Game(config);

const storiesEl = document.getElementById("stories");
if (storiesEl == null) throw "no sidebar";
const titleEl = document.getElementById("gameTitle");

let prevStoryClose: () => void | undefined;
const runInGame = async (story: IStory, game: Phaser.Game) => {
  prevStoryClose?.();

  setSearchParam("title", story.title);
  titleEl!.innerHTML = story.title;
  const scene = game.scene.getScene(StoryScene.name);
  prevStoryClose = await story.run(scene);
};

let storiesIndex = 0;
stories.forEach((story) => {
  if (story.run != null) {
    const isStartIndex = storiesIndex === 0;
    const titleParam = getSearchParam("title");
    const isStart = titleParam != null ? titleParam === story.title : isStartIndex;
    addStory(story as IStory, storiesEl, isStart);
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

function setSearchParam(param: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);
  window.history.replaceState({}, "", url.toString());
}

function getSearchParam(param: string): string | undefined {
  const paramValue = new URLSearchParams(window.location.search).get(param);

  return paramValue != null ? decodeURI(paramValue) : undefined;
}
