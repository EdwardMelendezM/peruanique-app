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

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  nodeId: z.string().uuid(),
  status: z.string(),
  scoreObtained: z.number(),
  starsEarned: z.number(),
});

export const SyncQueueSchema = z.object({
  id: z.number(),
  type: z.string(),
  amount: z.number(),
  current: z.number(),
  createdAt: z.string(),
  status: z.string(),
});

export const SyncPushSchema = z.object({
  attempts: z.array(LessonAttemptSchema),
  userProgress: z.array(UserProfileSchema),
  syncQueues: z.array(SyncQueueSchema),
});