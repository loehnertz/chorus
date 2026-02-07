import { z } from 'zod';
import { FREQUENCIES } from '@/types/frequency';
import { parseUtcDateInput, startOfTodayUtc } from '@/lib/date';

const VALID_FREQUENCIES = FREQUENCIES;

export const createChoreSchema = z.object({
  title: z.string().transform((s) => s.trim()).pipe(z.string().min(1, 'Title is required')),
  frequency: z.enum(VALID_FREQUENCIES, {
    message: `Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
  }),
  description: z
    .string()
    .transform((s) => s.trim() || null)
    .optional()
    .default(''),
  assigneeIds: z.array(z.string()).optional(),
});

export const updateChoreSchema = z
  .object({
    title: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Title cannot be empty'))
      .optional(),
    frequency: z
      .enum(VALID_FREQUENCIES, {
        message: `Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      })
      .optional(),
    description: z
      .string()
      .transform((s) => s.trim() || null)
      .nullable()
      .optional(),
    assigneeIds: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const createCompletionSchema = z.object({
  choreId: z.string().min(1, 'choreId is required'),
  scheduleId: z.string().optional(),
  notes: z
    .string()
    .transform((s) => s.trim() || null)
    .optional()
    .default(''),
  completedAt: utcDateField('completedAt').optional(),
});

export const assignChoreSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

function utcDateField(fieldName: string) {
  return z.preprocess(
    (value) => parseUtcDateInput(value) ?? value,
    z.date({
      message: `${fieldName} must be an ISO date with timezone (e.g. 2026-02-01T00:00:00Z) or YYYY-MM-DD`,
    }),
  );
}

export const createScheduleSchema = z.object({
  choreId: z.string().transform((s) => s.trim()).pipe(z.string().min(1, 'choreId is required')),
  scheduledFor: utcDateField('scheduledFor').transform((d) => startOfTodayUtc(d)),
  slotType: z.enum(VALID_FREQUENCIES, {
    message: `Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
  }),
  suggested: z.boolean().optional().default(true),
});

export const scheduleSuggestSchema = z
  .object({
    currentFrequency: z
      .enum(VALID_FREQUENCIES, {
        message: `Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      })
      .optional(),
    // Backwards/alternate name used in docs and API conventions
    slotType: z
      .enum(VALID_FREQUENCIES, {
        message: `Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      })
      .optional(),
    userId: z.string().transform((s) => s.trim()).pipe(z.string().min(1)).optional(),
    forDate: utcDateField('forDate').optional(),
    scheduledFor: utcDateField('scheduledFor').optional(),
  })
  .refine((data) => data.currentFrequency || data.slotType, {
    message: 'currentFrequency is required',
    path: ['currentFrequency'],
  })
  .transform((data) => ({
    currentFrequency: (data.currentFrequency ?? data.slotType)!,
    userId: data.userId,
    forDate: data.forDate ?? data.scheduledFor
      ? startOfTodayUtc((data.forDate ?? data.scheduledFor)!)
      : undefined,
  }));

export const listCompletionsQuerySchema = z
  .object({
    choreId: z.string().transform((s) => s.trim()).pipe(z.string().min(1)).optional(),
    userId: z.string().transform((s) => s.trim()).pipe(z.string().min(1)).optional(),
    from: utcDateField('from').optional(),
    to: utcDateField('to').optional(),
    // Match existing API behavior: clamp limit to 100 (don't hard-fail on >100).
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .default(50)
      .transform((n) => Math.min(n, 100)),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .refine((data) => !(data.from && data.to) || data.from <= data.to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  });

export const listSchedulesQuerySchema = z
  .object({
    from: utcDateField('from').optional(),
    to: utcDateField('to').optional(),
    frequency: z
      .enum(VALID_FREQUENCIES, {
        message: `Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      })
      .optional(),
  })
  .refine((data) => !(data.from && data.to) || data.from <= data.to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  });

/**
 * Format Zod validation errors into a structured API response
 */
export function formatValidationError(error: z.ZodError) {
  const flat = z.flattenError(error);
  return {
    error: 'Validation failed',
    details: {
      formErrors: flat.formErrors,
      fieldErrors: flat.fieldErrors,
    },
  };
}
