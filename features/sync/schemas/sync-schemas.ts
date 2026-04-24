import { z } from 'zod';

export const LessonAttemptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  nodeId: z.string(),
  questionId: z.string(),
  selectedAnswerId: z.string(),
  isCorrect: z.boolean(),
  timeSeconds: z.number(),
  answeredAt: z.number(), // Viene como timestamp (ms) de SQLite
});

export const SyncPushSchema = z.object({
  attempts: z.array(LessonAttemptSchema),
});

export const SyncPullSchema = z.object({
  groupId: z.string(),
});