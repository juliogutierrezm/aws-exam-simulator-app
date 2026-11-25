import {
  getUserAttempts,
  type UserAttempt
} from "./getUserAttempts.js";

import type {
  AttemptMode
} from "./createAttempt.js";

export type GetUserStatisticsInput = {
  userId: string;
  certificationId?: string;
  mode?: AttemptMode;
};

const round = (value: number): number => {
  return Number(value.toFixed(2));
};

const percentage = (
  value: number,
  total: number
): number | null => {
  if (total === 0) {
    return null;
  }

  return round((value / total) * 100);
};

const hasValidScore = (
  attempt: UserAttempt
): boolean => {
  return (
    typeof attempt.score === "number" &&
    Number.isFinite(attempt.score) &&
    attempt.score >= 0 &&
    attempt.score <= 100
  );
};

const calculateSummary = (
  attempts: UserAttempt[]
) => {
  const completedAttempts = attempts.filter(
    (attempt) =>
      attempt.status === "COMPLETED"
  );

  const inProgressAttempts = attempts.filter(
    (attempt) =>
      attempt.status === "IN_PROGRESS"
  );

  const scoredAttempts = completedAttempts.filter(
    hasValidScore
  );

  const completedExams = completedAttempts.filter(
    (attempt) =>
      attempt.mode === "EXAM"
  );

  const completedPractices =
    completedAttempts.filter(
      (attempt) =>
        attempt.mode === "PRACTICE"
    );

  let totalQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unansweredQuestions = 0;

  let accuracyQuestionCount = 0;
  let classifiedQuestionCount = 0;

  let totalDurationSeconds = 0;
  let durationAttemptsCount = 0;

  for (const attempt of completedAttempts) {
    totalQuestions += attempt.totalQuestions;

    if (
      attempt.correctCount !== null &&
      attempt.correctCount >= 0 &&
      attempt.correctCount <= attempt.totalQuestions
    ) {
      correctAnswers += attempt.correctCount;

      accuracyQuestionCount +=
        attempt.totalQuestions;
    }

    if (
      attempt.correctCount !== null &&
      attempt.incorrectCount !== null &&
      attempt.unansweredCount !== null &&
      attempt.correctCount >= 0 &&
      attempt.incorrectCount >= 0 &&
      attempt.unansweredCount >= 0 &&
      attempt.correctCount +
        attempt.incorrectCount +
        attempt.unansweredCount ===
          attempt.totalQuestions
    ) {
      incorrectAnswers += attempt.incorrectCount;

      unansweredQuestions +=
        attempt.unansweredCount;

      classifiedQuestionCount +=
        attempt.totalQuestions;
    }

    if (
      typeof attempt.durationSeconds === "number" &&
      Number.isFinite(attempt.durationSeconds) &&
      attempt.durationSeconds >= 0
    ) {
      totalDurationSeconds +=
        attempt.durationSeconds;

      durationAttemptsCount++;
    }
  }

  const scores = scoredAttempts.map(
    (attempt) => attempt.score!
  );

  const averageScore =
    scores.length > 0
      ? round(
          scores.reduce(
            (sum, score) => sum + score,
            0
          ) / scores.length
        )
      : null;

  const bestScore =
    scores.length > 0
      ? scores.reduce(
          (best, score) =>
            Math.max(best, score),
          0
        )
      : null;

  const lowestScore =
    scores.length > 0
      ? scores.reduce(
          (lowest, score) =>
            Math.min(lowest, score),
          100
        )
      : null;

  return {
    totalAttempts: attempts.length,

    completedAttempts:
      completedAttempts.length,

    inProgressAttempts:
      inProgressAttempts.length,

    completedExams:
      completedExams.length,

    completedPractices:
      completedPractices.length,

    scoredAttempts:
      scoredAttempts.length,

    averageScore,
    bestScore,
    lowestScore,

    accuracy: percentage(
      correctAnswers,
      accuracyQuestionCount
    ),

    totalQuestions,

    correctAnswers:
      accuracyQuestionCount > 0
        ? correctAnswers
        : null,

    incorrectAnswers:
      classifiedQuestionCount > 0
        ? incorrectAnswers
        : null,

    unansweredQuestions:
      classifiedQuestionCount > 0
        ? unansweredQuestions
        : null,

    accuracyQuestionCount,
    classifiedQuestionCount,

    totalDurationSeconds,

    averageDurationSeconds:
      durationAttemptsCount > 0
        ? Math.round(
            totalDurationSeconds /
              durationAttemptsCount
          )
        : null,

    durationAttemptsCount
  };
};

export const getUserStatistics = async (
  input: GetUserStatisticsInput
) => {
  const attempts: UserAttempt[] = [];

  let nextToken: string | null = null;

  do {
    const response = await getUserAttempts({
      userId: input.userId,

      ...(input.certificationId
        ? {
            certificationId:
              input.certificationId
          }
        : {}),

      ...(input.mode
        ? { mode: input.mode }
        : {}),

      limit: 100,

      ...(nextToken
        ? { nextToken }
        : {})
    });

    attempts.push(...response.items);

    nextToken = response.nextToken;

  } while (nextToken);

  const summary = calculateSummary(attempts);

  const completedAttempts = attempts.filter(
    (attempt) =>
      attempt.status === "COMPLETED"
  );

  const performanceTrend = completedAttempts
    .filter(hasValidScore)
    .sort((a, b) =>
      (a.completedAt ?? a.startedAt)
        .localeCompare(
          b.completedAt ?? b.startedAt
        )
    )
    .slice(-50)
    .map((attempt) => ({
      attemptId: attempt.attemptId,

      certificationId:
        attempt.certificationId,

      mode: attempt.mode,
      examId: attempt.examId,
      filters: attempt.filters,

      score: attempt.score,

      questionCount:
        attempt.totalQuestions,

      completedAt:
        attempt.completedAt
    }));

  const certificationGroups =
    new Map<string, UserAttempt[]>();

  for (const attempt of attempts) {
    const certificationId =
      attempt.certificationId;

    const group =
      certificationGroups.get(
        certificationId
      ) ?? [];

    group.push(attempt);

    certificationGroups.set(
      certificationId,
      group
    );
  }

  const byCertification = [
    ...certificationGroups.entries()
  ]
    .map(([certificationId, group]) => ({
      certificationId,
      ...calculateSummary(group)
    }))
    .sort((a, b) =>
      b.completedAttempts -
      a.completedAttempts
    );

  const byMode = (
    ["EXAM", "PRACTICE"] as const
  ).map((mode) => ({
    mode,

    ...calculateSummary(
      attempts.filter(
        (attempt) => attempt.mode === mode
      )
    )
  }));

  return {
    generatedAt: new Date().toISOString(),

    filters: {
      certificationId:
        input.certificationId ?? null,

      mode: input.mode ?? null
    },

    summary,

    performanceTrend,
    byCertification,
    byMode
  };
};