import { IStory } from "../../../storybook/interfaces";
import { TestButton } from "./TestButton";

export const testButtonStory: IStory = {
  title: "TestButton",
  run: async (scene) => {
    const container = new TestButton({ scene, text: "Hello" });

    return ()=>{
      container.destroy();
    }
  }
};

export const testButtonStory2: IStory = {
  title: "TestButton 2",
  run: async (scene) => {
    const container = new TestButton({ scene, text: "Hello2" });

    return ()=>{
      container.destroy();
    }
  }
};
