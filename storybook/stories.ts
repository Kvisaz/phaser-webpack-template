import { IStoryListItem, storyTitle } from "./interfaces";

export const stories: IStoryListItem[] = Array.from(
  new Set<IStoryListItem>([
    storyTitle("Simple Games"),
  ])
);
