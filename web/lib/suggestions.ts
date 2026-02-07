import { Frequency } from '@prisma/client';

import { db } from '@/lib/db';
import {
  startOfTodayUtc,
  startOfWeekUtc,
  endOfWeekUtc,
  startOfBiweekUtc,
  endOfBiweekUtc,
  startOfBimonthUtc,
  endOfBimonthUtc,
  startOfHalfYearUtc,
  endOfHalfYearUtc,
  startOfMonthUtc,
  endOfMonthUtc,
  startOfYearUtc,
  endOfYearUtc,
} from '@/lib/date';

export type PaceWarning = {
  sourceFrequency: Frequency;
  remainingChores: number;
  remainingSlots: number;
  scheduledChores: number;
  totalChores: number;
  cycleStart: Date;
  cycleEnd: Date;
  message: string;
};

export type CascadeSuggestion = {
  sourceFrequency: Frequency;
  cycleStart: Date;
  cycleEnd: Date;
  chore: {
    id: string;
    title: string;
    description: string | null;
    frequency: Frequency;
  };
};

type UtcRange = { start: Date; end: Date };

function getCycleRangeForSourceFrequency(sourceFrequency: Frequency, now: Date): UtcRange {
  switch (sourceFrequency) {
    case Frequency.WEEKLY:
      return { start: startOfWeekUtc(now), end: endOfWeekUtc(now) };
    case Frequency.BIWEEKLY:
      return { start: startOfBiweekUtc(now), end: endOfBiweekUtc(now) };
    case Frequency.MONTHLY:
      return { start: startOfMonthUtc(now), end: endOfMonthUtc(now) };
    case Frequency.BIMONTHLY:
      return { start: startOfBimonthUtc(now), end: endOfBimonthUtc(now) };
    case Frequency.SEMIANNUAL:
      return { start: startOfHalfYearUtc(now), end: endOfHalfYearUtc(now) };
    case Frequency.YEARLY:
      return { start: startOfYearUtc(now), end: endOfYearUtc(now) };
    default:
      // DAILY isn't a cascade source.
      return {
        start: startOfTodayUtc(now),
        end: new Date(startOfTodayUtc(now).getTime() + 24 * 60 * 60 * 1000),
      };
  }
}

function getRemainingSlotsForSourceFrequency(sourceFrequency: Frequency, now: Date, cycleEnd: Date) {
  const dayStart = startOfTodayUtc(now);
  const remainingDays = Math.max(0, Math.ceil((cycleEnd.getTime() - dayStart.getTime()) / (24 * 60 * 60 * 1000)));

  switch (sourceFrequency) {
    case Frequency.WEEKLY:
      // Weekly chores should fit into remaining days of the week (1 per day).
      return remainingDays;
    case Frequency.BIWEEKLY:
      // Bi-weekly chores: remaining weeks in bi-week (max 2).
      return Math.max(1, Math.ceil(remainingDays / 7));
    case Frequency.MONTHLY:
      // Monthly chores should fit into remaining weeks of the month (1 per week).
      return Math.max(1, Math.ceil(remainingDays / 7));
    case Frequency.BIMONTHLY:
      // Bi-monthly chores: remaining months in bi-month (max 2).
      return Math.max(1, Math.ceil(remainingDays / 30));
    case Frequency.SEMIANNUAL:
      // Semi-annual chores: remaining bi-months in half-year (max 3).
      return Math.max(1, Math.ceil(remainingDays / 60));
    case Frequency.YEARLY:
      // Yearly chores should fit into remaining months of the year (1 per month).
      return 12 - now.getUTCMonth();
    default:
      return 0;
  }
}

export function getCascadeSourceFrequency(currentFrequency: Frequency | `${Frequency}`): Frequency | null {
  const freq = currentFrequency as Frequency;
  if (freq === Frequency.DAILY) return Frequency.WEEKLY;
  if (freq === Frequency.WEEKLY) return Frequency.BIWEEKLY;
  if (freq === Frequency.BIWEEKLY) return Frequency.MONTHLY;
  if (freq === Frequency.MONTHLY) return Frequency.BIMONTHLY;
  if (freq === Frequency.BIMONTHLY) return Frequency.SEMIANNUAL;
  if (freq === Frequency.SEMIANNUAL) return Frequency.YEARLY;
  return null;
}

export async function suggestCascadedChore(params: {
  currentFrequency: Frequency | `${Frequency}`;
  userId?: string;
  now?: Date;
}): Promise<CascadeSuggestion | null> {
  const now = params.now ?? new Date();
  const sourceFrequency = getCascadeSourceFrequency(params.currentFrequency);
  if (!sourceFrequency) return null;

  const { start: cycleStart, end: cycleEnd } = getCycleRangeForSourceFrequency(sourceFrequency, now);

  const scheduled = await db.schedule.findMany({
    where: {
      scheduledFor: { gte: cycleStart, lt: cycleEnd },
      chore: { frequency: sourceFrequency },
    },
    distinct: ['choreId'],
    select: { choreId: true },
  });

  const scheduledIds = scheduled.map((s) => s.choreId);

  const chores = await db.chore.findMany({
    where: {
      frequency: sourceFrequency,
      ...(scheduledIds.length ? { id: { notIn: scheduledIds } } : {}),
    },
    include: {
      assignments: { select: { userId: true } },
      completions: {
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: { completedAt: true },
      },
    },
  });

  if (!chores.length) return null;

  const userId = params.userId;
  const assigned = userId
    ? chores.filter((c) => c.assignments.some((a) => a.userId === userId))
    : [];
  const candidates = assigned.length ? assigned : chores;

  candidates.sort((a, b) => {
    const aNever = a.completions.length === 0;
    const bNever = b.completions.length === 0;
    if (aNever !== bNever) return aNever ? -1 : 1;

    const aLast = a.completions[0]?.completedAt?.getTime() ?? 0;
    const bLast = b.completions[0]?.completedAt?.getTime() ?? 0;
    if (aLast !== bLast) return aLast - bLast;

    return a.title.localeCompare(b.title);
  });

  const top = candidates[0];
  return {
    sourceFrequency,
    cycleStart,
    cycleEnd,
    chore: {
      id: top.id,
      title: top.title,
      description: top.description ?? null,
      frequency: top.frequency,
    },
  };
}

export async function checkCascadePace(params?: { now?: Date }): Promise<PaceWarning[]> {
  const now = params?.now ?? new Date();
  const sources: Frequency[] = [
    Frequency.WEEKLY,
    Frequency.BIWEEKLY,
    Frequency.MONTHLY,
    Frequency.BIMONTHLY,
    Frequency.SEMIANNUAL,
    Frequency.YEARLY,
  ];

  const warnings: PaceWarning[] = [];

  for (const sourceFrequency of sources) {
    const { start: cycleStart, end: cycleEnd } = getCycleRangeForSourceFrequency(sourceFrequency, now);
    const remainingSlots = getRemainingSlotsForSourceFrequency(sourceFrequency, now, cycleEnd);

    const [totalChores, scheduledDistinct] = await Promise.all([
      db.chore.count({ where: { frequency: sourceFrequency } }),
      db.schedule.findMany({
        where: {
          scheduledFor: { gte: cycleStart, lt: cycleEnd },
          chore: { frequency: sourceFrequency },
        },
        distinct: ['choreId'],
        select: { choreId: true },
      }),
    ]);

    const scheduledChores = scheduledDistinct.length;
    const remainingChores = Math.max(0, totalChores - scheduledChores);

    if (remainingChores > remainingSlots) {
      warnings.push({
        sourceFrequency,
        remainingChores,
        remainingSlots,
        scheduledChores,
        totalChores,
        cycleStart,
        cycleEnd,
        message: `Behind pace for ${sourceFrequency}: ${remainingChores} remaining with only ${remainingSlots} slots left in this cycle.`,
      });
    }
  }

  return warnings;
}
