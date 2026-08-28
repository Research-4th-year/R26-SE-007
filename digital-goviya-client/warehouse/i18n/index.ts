import en from "./en";
import si from "./si";

export const translations = {
  en,
  si,
};

export type Language = keyof typeof translations;

export { en, si };