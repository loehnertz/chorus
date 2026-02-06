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
