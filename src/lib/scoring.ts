// Server-authoritative scoring engine (spec §9-11, §15, §44).
// Never trust a client-submitted score, time, or correctness flag — every
// value here is derived from server-recorded timestamps and the answer key.

export const DIFFICULTY_MULTIPLIER: Record<"EASY" | "MEDIUM" | "HARD", number> = {
  EASY: 1.0,
  MEDIUM: 1.15,
  HARD: 1.3,
};

export interface ScoreQuestionInput {
  isCorrect: boolean;
  responseTimeMs: number;
  maxTimeMs: number;
  accuracyWeight?: number; // percent points awarded for a correct answer, default 80
  speedWeight?: number; // max percent points awarded for speed, default 20
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  difficultyWeightingEnabled?: boolean;
  speedBonusEnabled?: boolean;
  negativeMarking?: boolean;
  negativeMarks?: number;
}

export interface ScoreQuestionResult {
  speedRatio: number;
  baseScore: number;
  speedScore: number;
  difficultyMultiplier: number;
  questionScore: number;
}

/** SpeedRatio = MAX(0, 1 - Tanswer/Tmax), clamped to [0, 1]. */
export function computeSpeedRatio(responseTimeMs: number, maxTimeMs: number): number {
  if (maxTimeMs <= 0) return 0;
  const ratio = 1 - responseTimeMs / maxTimeMs;
  return Math.max(0, Math.min(1, ratio));
}

/**
 * QuestionScore = accuracyWeight + speedWeight * speedRatio for a correct
 * answer, 0 (or -negativeMarks) for an incorrect one. Accuracy always
 * dominates: a wrong-but-fast answer can never outscore a correct one,
 * because the incorrect branch never sees the speed bonus.
 */
export function scoreQuestion(input: ScoreQuestionInput): ScoreQuestionResult {
  const accuracyWeight = input.accuracyWeight ?? 80;
  const speedWeight = input.speedWeight ?? 20;
  const speedRatio = computeSpeedRatio(input.responseTimeMs, input.maxTimeMs);

  if (!input.isCorrect) {
    const penalty = input.negativeMarking ? -(input.negativeMarks ?? 0) : 0;
    return {
      speedRatio,
      baseScore: penalty,
      speedScore: 0,
      difficultyMultiplier: 1,
      questionScore: penalty,
    };
  }

  const speedScore = input.speedBonusEnabled === false ? 0 : speedWeight * speedRatio;
  const baseScore = accuracyWeight + speedScore;

  const difficultyMultiplier =
    input.difficultyWeightingEnabled && input.difficulty
      ? DIFFICULTY_MULTIPLIER[input.difficulty]
      : 1;

  return {
    speedRatio,
    baseScore: accuracyWeight,
    speedScore,
    difficultyMultiplier,
    questionScore: baseScore * difficultyMultiplier,
  };
}

export interface AttemptSummaryInput {
  totalScore: number;
  correctCount: number;
  totalAnswered: number;
  totalResponseTimeMs: number;
  completedAt: Date | null;
}

/**
 * Leaderboard / final-rank comparator (spec §15, §44). Sorted ascending
 * (i.e. Array.sort(compareAttempts)) puts rank #1 first.
 * Tie-break order: score desc -> correct count desc -> accuracy desc ->
 * total response time asc -> completion time asc. Never random.
 */
export function compareAttempts(a: AttemptSummaryInput, b: AttemptSummaryInput): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;

  const accuracyA = a.totalAnswered > 0 ? a.correctCount / a.totalAnswered : 0;
  const accuracyB = b.totalAnswered > 0 ? b.correctCount / b.totalAnswered : 0;
  if (accuracyB !== accuracyA) return accuracyB - accuracyA;

  if (a.totalResponseTimeMs !== b.totalResponseTimeMs) {
    return a.totalResponseTimeMs - b.totalResponseTimeMs;
  }

  const timeA = a.completedAt ? a.completedAt.getTime() : Infinity;
  const timeB = b.completedAt ? b.completedAt.getTime() : Infinity;
  return timeA - timeB;
}

export function computeAccuracy(correctCount: number, totalAnswered: number): number {
  if (totalAnswered <= 0) return 0;
  return (correctCount / totalAnswered) * 100;
}
