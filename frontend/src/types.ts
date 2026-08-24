export type Difficulty = "easy" | "medium" | "hard";

export interface Story {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  teaser: string;
  solution: string;
}

export interface StoryList {
  version: number;
  generatedAt: string | null;
  source: "default" | "gemini" | "cache";
  stories: Story[];
}
