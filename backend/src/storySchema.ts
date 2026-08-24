import { z } from "zod";

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const StorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  difficulty: DifficultySchema,
  tags: z.array(z.string()).default([]),
  teaser: z.string().min(1),
  solution: z.string().min(1),
});
export type Story = z.infer<typeof StorySchema>;

export const StoryListSchema = z.object({
  version: z.number().int().nonnegative(),
  generatedAt: z.string().nullable(),
  source: z.enum(["default", "gemini"]),
  stories: z.array(StorySchema),
});
export type StoryList = z.infer<typeof StoryListSchema>;

// Schema we ask Gemini to follow (without the version/source wrapper).
export const GeminiStoryBatchSchema = z.object({
  stories: z.array(StorySchema).min(1),
});
