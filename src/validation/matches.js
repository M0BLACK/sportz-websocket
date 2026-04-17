import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
};

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Helper for ISO date validation
const isValidISODate = (val) => {
  const date = new Date(val);
  return !isNaN(date.getTime()) && date.toISOString() === val;
};

export const createMatchSchema = z.object({
  sport: z.string().min(1, { message: 'sport cannot be empty' }),
  homeTeam: z.string().min(1, { message: 'homeTeam cannot be empty' }),
  awayTeam: z.string().min(1, { message: 'awayTeam cannot be empty' }),
  startTime: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'startTime must be a valid ISO date string' }
  ),
  endTime: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'endTime must be a valid ISO date string' }
  ),
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be chronologically after startTime',
        path: ['endTime'],
      });
    }
  }
});

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0, { message: 'homeScore must be a non-negative integer' }),
  awayScore: z.coerce.number().int().min(0, { message: 'awayScore must be a non-negative integer' }),
});
