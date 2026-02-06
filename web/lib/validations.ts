import { z } from 'zod';

const VALID_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

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
  completedAt: z.coerce.date().optional(),
});

export const assignChoreSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});
export const createScheduleSchema = z.object({
  choreId: z.string().transform((s) => s.trim()).pipe(z.string().min(1, 'choreId is required')),
  scheduledFor: z.coerce.date({ message: 'scheduledFor must be a valid date' }),
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
  })
  .refine((data) => data.currentFrequency || data.slotType, {
    message: 'currentFrequency is required',
    path: ['currentFrequency'],
  })
  .transform((data) => ({
    currentFrequency: (data.currentFrequency ?? data.slotType)!,
    userId: data.userId,
  }));

export const listSchedulesQuerySchema = z
  .object({
    from: z.coerce.date({ message: 'from must be a valid date' }).optional(),
    to: z.coerce.date({ message: 'to must be a valid date' }).optional(),
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
