import { IStoryListItem, storyTitle } from "./interfaces";
import { textRectangleStory } from "./stories/textRectangle.Story";
import { testButtonStory, testButtonStory2 } from "./stories/TestButton.story";

export const stories: IStoryListItem[] = Array.from(
  new Set<IStoryListItem>([
    storyTitle("Simple Components"),
    textRectangleStory,
    testButtonStory,
    testButtonStory2
  ])
);
