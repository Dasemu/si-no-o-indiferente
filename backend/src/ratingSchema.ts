import { z } from "zod";

export const RatingInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const RatingEntrySchema = z.object({
  storyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  ratedAt: z.string(),
});
export type RatingEntry = z.infer<typeof RatingEntrySchema>;
