import {
  createChoreSchema,
  updateChoreSchema,
  createCompletionSchema,
  assignChoreSchema,
  createScheduleSchema,
  scheduleSuggestSchema,
  listSchedulesQuerySchema,
  formatValidationError,
} from '../validations';

describe('createChoreSchema', () => {
  it('should validate a valid chore', () => {
    const result = createChoreSchema.safeParse({
      title: 'Dishes',
      frequency: 'DAILY',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Dishes');
      expect(result.data.frequency).toBe('DAILY');
    }
  });

  it('should trim title', () => {
    const result = createChoreSchema.safeParse({
      title: '  Dishes  ',
      frequency: 'DAILY',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Dishes');
    }
  });

  it('should reject empty title', () => {
    const result = createChoreSchema.safeParse({
      title: '',
      frequency: 'DAILY',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing title', () => {
    const result = createChoreSchema.safeParse({
      frequency: 'DAILY',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid frequency', () => {
    const result = createChoreSchema.safeParse({
      title: 'Dishes',
      frequency: 'HOURLY',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid frequencies', () => {
    for (const freq of ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']) {
      const result = createChoreSchema.safeParse({
        title: 'Test',
        frequency: freq,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept optional description', () => {
    const result = createChoreSchema.safeParse({
      title: 'Dishes',
      frequency: 'DAILY',
      description: 'Clean all dishes',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Clean all dishes');
    }
  });

  it('should trim description and convert empty to null', () => {
    const result = createChoreSchema.safeParse({
      title: 'Dishes',
      frequency: 'DAILY',
      description: '   ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it('should accept optional assigneeIds array', () => {
    const result = createChoreSchema.safeParse({
      title: 'Dishes',
      frequency: 'DAILY',
      assigneeIds: ['user-1', 'user-2'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assigneeIds).toEqual(['user-1', 'user-2']);
    }
  });

  it('should reject non-array assigneeIds', () => {
    const result = createChoreSchema.safeParse({
      title: 'Dishes',
      frequency: 'DAILY',
      assigneeIds: 'not-array',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateChoreSchema', () => {
  it('should accept partial update with title', () => {
    const result = updateChoreSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('should accept partial update with frequency', () => {
    const result = updateChoreSchema.safeParse({ frequency: 'WEEKLY' });
    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = updateChoreSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const result = updateChoreSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid frequency', () => {
    const result = updateChoreSchema.safeParse({ frequency: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

describe('createCompletionSchema', () => {
  it('should validate a valid completion', () => {
    const result = createCompletionSchema.safeParse({ choreId: 'chore-1' });
    expect(result.success).toBe(true);
  });

  it('should reject empty choreId', () => {
    const result = createCompletionSchema.safeParse({ choreId: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing choreId', () => {
    const result = createCompletionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept optional scheduleId', () => {
    const result = createCompletionSchema.safeParse({
      choreId: 'chore-1',
      scheduleId: 'sched-1',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional notes and trim them', () => {
    const result = createCompletionSchema.safeParse({
      choreId: 'chore-1',
      notes: '  Done well  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Done well');
    }
  });

  it('should coerce completedAt to Date', () => {
    const result = createCompletionSchema.safeParse({
      choreId: 'chore-1',
      completedAt: '2024-06-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completedAt).toBeInstanceOf(Date);
    }
  });
});

describe('assignChoreSchema', () => {
  it('should validate a valid userId', () => {
    const result = assignChoreSchema.safeParse({ userId: 'user-1' });
    expect(result.success).toBe(true);
  });

  it('should reject empty userId', () => {
    const result = assignChoreSchema.safeParse({ userId: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing userId', () => {
    const result = assignChoreSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('createScheduleSchema', () => {
  it('should validate a valid schedule', () => {
    const result = createScheduleSchema.safeParse({
      choreId: 'chore-1',
      scheduledFor: '2026-02-01T00:00:00Z',
      slotType: 'DAILY',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.choreId).toBe('chore-1');
      expect(result.data.scheduledFor).toBeInstanceOf(Date);
      expect(result.data.suggested).toBe(true);
    }
  });

  it('should reject empty choreId', () => {
    const result = createScheduleSchema.safeParse({
      choreId: '   ',
      scheduledFor: '2026-02-01T00:00:00Z',
      slotType: 'DAILY',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid slotType', () => {
    const result = createScheduleSchema.safeParse({
      choreId: 'chore-1',
      scheduledFor: '2026-02-01T00:00:00Z',
      slotType: 'HOURLY',
    });
    expect(result.success).toBe(false);
  });
});

describe('scheduleSuggestSchema', () => {
  it('should accept currentFrequency', () => {
    const result = scheduleSuggestSchema.safeParse({ currentFrequency: 'DAILY' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentFrequency).toBe('DAILY');
    }
  });

  it('should accept slotType alias and normalize to currentFrequency', () => {
    const result = scheduleSuggestSchema.safeParse({ slotType: 'WEEKLY' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentFrequency).toBe('WEEKLY');
    }
  });

  it('should reject when neither currentFrequency nor slotType provided', () => {
    const result = scheduleSuggestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('listSchedulesQuerySchema', () => {
  it('should validate empty query', () => {
    const result = listSchedulesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should coerce from/to to Dates', () => {
    const result = listSchedulesQuerySchema.safeParse({ from: '2026-01-01', to: '2026-01-31' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeInstanceOf(Date);
      expect(result.data.to).toBeInstanceOf(Date);
    }
  });

  it('should reject when from is after to', () => {
    const result = listSchedulesQuerySchema.safeParse({ from: '2026-02-01', to: '2026-01-01' });
    expect(result.success).toBe(false);
  });
});

describe('formatValidationError', () => {
  it('should format field errors', () => {
    const result = createChoreSchema.safeParse({ frequency: 'INVALID' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted.error).toBe('Validation failed');
      expect(formatted.details).toHaveProperty('fieldErrors');
      expect(formatted.details).toHaveProperty('formErrors');
    }
  });
});
