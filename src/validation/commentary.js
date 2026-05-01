import { z } from 'zod';

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: z.coerce.number().int().nonnegative({ message: 'minute must be a non-negative integer' }),
  sequence: z.coerce.number().int().nonnegative({ message: 'sequence must be a non-negative integer' }),
  period: z.string().min(1, { message: 'period cannot be empty' }),
  eventType: z.string().min(1, { message: 'eventType cannot be empty' }),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().min(1, { message: 'message cannot be empty' }),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).default([]),
});
