import { HtmlBodyBackground } from "./HtmlBodyBackground";

export const setBodyBackgroundImage = (url: string, fallbackUrl?: string) => {
  HtmlBodyBackground.setImage(url, fallbackUrl);
};
