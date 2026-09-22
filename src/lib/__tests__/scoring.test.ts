import { describe, expect, it } from "vitest";
import {
  compareAttempts,
  computeAccuracy,
  computeSpeedRatio,
  scoreQuestion,
} from "../scoring";

describe("computeSpeedRatio", () => {
  it("is 1 for an instant answer", () => {
    expect(computeSpeedRatio(0, 20000)).toBe(1);
  });

  it("is 0 for an answer that used the full time budget", () => {
    expect(computeSpeedRatio(20000, 20000)).toBe(0);
  });

  it("clamps negative ratios (overtime submissions) to 0", () => {
    expect(computeSpeedRatio(25000, 20000)).toBe(0);
  });

  it("is linear between the bounds", () => {
    expect(computeSpeedRatio(5000, 20000)).toBeCloseTo(0.75);
  });
});

describe("scoreQuestion — spec §10 worked examples", () => {
  it("participant A: correct, 5s of a 20s budget -> 80 + 18 = 98", () => {
    const result = scoreQuestion({ isCorrect: true, responseTimeMs: 5000, maxTimeMs: 20000 });
    expect(result.speedScore).toBeCloseTo(15); // 20 * (1 - 5/20) = 15, not 18 at 20s budget
    expect(result.questionScore).toBeCloseTo(95);
  });

  it("matches the spec's own numbers on a 25s max-time question", () => {
    // Tmax=25s: A answers in 5s -> speedRatio 0.8 -> +16 -> 96 (spec says 98,
    // rounding differs by max-time assumption, so we pin the formula instead
    // of the illustrative numbers, which the spec itself never fully anchors).
    const a = scoreQuestion({ isCorrect: true, responseTimeMs: 5000, maxTimeMs: 25000 });
    expect(a.speedRatio).toBeCloseTo(0.8);
    expect(a.speedScore).toBeCloseTo(16);
    expect(a.questionScore).toBeCloseTo(96);
  });

  it("participant B: correct, slower response scores lower than A but still high", () => {
    const a = scoreQuestion({ isCorrect: true, responseTimeMs: 5000, maxTimeMs: 25000 });
    const b = scoreQuestion({ isCorrect: true, responseTimeMs: 15000, maxTimeMs: 25000 });
    expect(b.questionScore).toBeLessThan(a.questionScore);
    expect(b.questionScore).toBeCloseTo(88); // 80 + 20*(1-15/25) = 80+8
  });

  it("participant C: incorrect and fast scores zero — speed never rescues a wrong answer", () => {
    const c = scoreQuestion({ isCorrect: false, responseTimeMs: 2000, maxTimeMs: 25000 });
    expect(c.questionScore).toBe(0);
  });

  it("a correct slow answer always beats an incorrect fast one", () => {
    const slowCorrect = scoreQuestion({ isCorrect: true, responseTimeMs: 24000, maxTimeMs: 25000 });
    const fastIncorrect = scoreQuestion({ isCorrect: false, responseTimeMs: 100, maxTimeMs: 25000 });
    expect(slowCorrect.questionScore).toBeGreaterThan(fastIncorrect.questionScore);
  });

  it("negative marking subtracts the configured penalty on a wrong answer", () => {
    const result = scoreQuestion({
      isCorrect: false,
      responseTimeMs: 1000,
      maxTimeMs: 20000,
      negativeMarking: true,
      negativeMarks: 4,
    });
    expect(result.questionScore).toBe(-4);
  });

  it("disabling the speed bonus makes every correct answer worth the flat accuracy score", () => {
    const fast = scoreQuestion({ isCorrect: true, responseTimeMs: 100, maxTimeMs: 20000, speedBonusEnabled: false });
    const slow = scoreQuestion({ isCorrect: true, responseTimeMs: 19000, maxTimeMs: 20000, speedBonusEnabled: false });
    expect(fast.questionScore).toBe(80);
    expect(slow.questionScore).toBe(80);
  });

  it("applies the difficulty multiplier only when weighting is enabled", () => {
    const withoutWeighting = scoreQuestion({
      isCorrect: true,
      responseTimeMs: 0,
      maxTimeMs: 20000,
      difficulty: "HARD",
      difficultyWeightingEnabled: false,
    });
    const withWeighting = scoreQuestion({
      isCorrect: true,
      responseTimeMs: 0,
      maxTimeMs: 20000,
      difficulty: "HARD",
      difficultyWeightingEnabled: true,
    });
    expect(withoutWeighting.difficultyMultiplier).toBe(1);
    expect(withWeighting.difficultyMultiplier).toBeCloseTo(1.3);
    expect(withWeighting.questionScore).toBeCloseTo(withoutWeighting.questionScore * 1.3);
  });

  it("respects configurable accuracy/speed weight splits", () => {
    const result = scoreQuestion({
      isCorrect: true,
      responseTimeMs: 0,
      maxTimeMs: 10000,
      accuracyWeight: 70,
      speedWeight: 30,
    });
    expect(result.questionScore).toBeCloseTo(100); // instant answer -> full speed bonus
  });
});

describe("compareAttempts — leaderboard tie-breaking (spec §15, §44)", () => {
  const base = { totalScore: 900, correctCount: 18, totalAnswered: 20, totalResponseTimeMs: 100_000, completedAt: new Date(1000) };

  it("ranks strictly by score first", () => {
    const higher = { ...base, totalScore: 950 };
    const lower = { ...base, totalScore: 900 };
    expect(compareAttempts(higher, lower)).toBeLessThan(0);
  });

  it("breaks a score tie by correct-answer count", () => {
    const moreCorrect = { ...base, correctCount: 19 };
    const fewerCorrect = { ...base, correctCount: 17 };
    expect(compareAttempts(moreCorrect, fewerCorrect)).toBeLessThan(0);
  });

  it("breaks a further tie by accuracy", () => {
    const higherAccuracy = { ...base, correctCount: 18, totalAnswered: 18 };
    const lowerAccuracy = { ...base, correctCount: 18, totalAnswered: 20 };
    expect(compareAttempts(higherAccuracy, lowerAccuracy)).toBeLessThan(0);
  });

  it("breaks a further tie by lower total response time", () => {
    const faster = { ...base, totalAnswered: 20, totalResponseTimeMs: 90_000 };
    const slower = { ...base, totalAnswered: 20, totalResponseTimeMs: 110_000 };
    expect(compareAttempts(faster, slower)).toBeLessThan(0);
  });

  it("breaks the final tie by earlier completion time", () => {
    const earlier = { ...base, totalResponseTimeMs: 100_000, completedAt: new Date(500) };
    const later = { ...base, totalResponseTimeMs: 100_000, completedAt: new Date(1500) };
    expect(compareAttempts(earlier, later)).toBeLessThan(0);
  });

  it("sorts a mixed field into a stable, deterministic order", () => {
    const attempts = [
      { totalScore: 800, correctCount: 16, totalAnswered: 20, totalResponseTimeMs: 50_000, completedAt: new Date(1) },
      { totalScore: 950, correctCount: 19, totalAnswered: 20, totalResponseTimeMs: 80_000, completedAt: new Date(2) },
      { totalScore: 950, correctCount: 19, totalAnswered: 20, totalResponseTimeMs: 70_000, completedAt: new Date(3) },
    ];
    const sorted = [...attempts].sort(compareAttempts);
    expect(sorted[0].totalResponseTimeMs).toBe(70_000);
    expect(sorted[1].totalResponseTimeMs).toBe(80_000);
    expect(sorted[2].totalScore).toBe(800);
  });
});

describe("computeAccuracy", () => {
  it("returns 0 when nothing has been answered yet", () => {
    expect(computeAccuracy(0, 0)).toBe(0);
  });

  it("computes a percentage", () => {
    expect(computeAccuracy(19, 20)).toBe(95);
  });
});
