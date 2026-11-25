import { getAttempt } from "./getAttempt.js";

import type {
  UserAttempt
} from "./getUserAttempts.js";

import {
  getQuestionsByIds
} from "../content/getQuestionsByIds.js";

type PerformanceCounter = {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
};

type PerformanceMap = Map<
  string,
  PerformanceCounter
>;

type QuestionOutcome =
  | "CORRECT"
  | "INCORRECT"
  | "UNANSWERED";

type GetUserPerformanceInput = {
  userId: string;
  attempts: UserAttempt[];
};

const createCounter = (): PerformanceCounter => ({
  totalQuestions: 0,
  correctCount: 0,
  incorrectCount: 0,
  unansweredCount: 0
});

const normalizeAnswers = (
  answers: string[]
): string[] => {
  return [...new Set(answers)].sort();
};

const answersMatch = (
  selected: string[],
  correct: string[]
): boolean => {
  const normalizedSelected =
    normalizeAnswers(selected);

  const normalizedCorrect =
    normalizeAnswers(correct);

  return (
    normalizedSelected.length ===
      normalizedCorrect.length &&
    normalizedSelected.every(
      (answer, index) =>
        answer === normalizedCorrect[index]
    )
  );
};

const getOutcome = (
  selected: string[],
  correct: string[]
): QuestionOutcome => {
  if (selected.length === 0) {
    return "UNANSWERED";
  }

  return answersMatch(selected, correct)
    ? "CORRECT"
    : "INCORRECT";
};

const incrementCounter = (
  counter: PerformanceCounter,
  outcome: QuestionOutcome
): void => {
  counter.totalQuestions++;

  switch (outcome) {
    case "CORRECT":
      counter.correctCount++;
      break;

    case "INCORRECT":
      counter.incorrectCount++;
      break;

    case "UNANSWERED":
      counter.unansweredCount++;
      break;
  }
};

const addPerformance = (
  map: PerformanceMap,
  key: string,
  outcome: QuestionOutcome
): void => {
  if (!key) {
    return;
  }

  const counter =
    map.get(key) ?? createCounter();

  incrementCounter(counter, outcome);

  map.set(key, counter);
};

const calculateAccuracy = (
  counter: PerformanceCounter
): number | null => {
  if (counter.totalQuestions === 0) {
    return null;
  }

  return Number(
    (
      (
        counter.correctCount /
        counter.totalQuestions
      ) * 100
    ).toFixed(2)
  );
};

const formatPerformance = (
  map: PerformanceMap
) => {
  return [...map.entries()]
    .map(([id, counter]) => ({
      id,

      ...counter,

      answeredCount:
        counter.correctCount +
        counter.incorrectCount,

      accuracy:
        calculateAccuracy(counter)
    }))
    .sort((a, b) =>
      b.totalQuestions - a.totalQuestions ||
      a.id.localeCompare(b.id)
    );
};

export const getUserPerformance = async (
  input: GetUserPerformanceInput
) => {
  const byDomain: PerformanceMap = new Map();
  const byService: PerformanceMap = new Map();
  const byConcept: PerformanceMap = new Map();
  const bySelectCount: PerformanceMap = new Map();
  const byDifficulty: PerformanceMap = new Map();
  const byArchitecturePattern: PerformanceMap =
    new Map();

  const overall = createCounter();

  const completedAttempts =
    input.attempts.filter(
      (attempt) =>
        attempt.status === "COMPLETED"
    );

  // Limit detailed analysis for the MVP.
  const maxAttempts = 20;

  const selectedAttempts = [
    ...completedAttempts
  ]
    .sort((a, b) =>
      (b.completedAt ?? b.startedAt)
        .localeCompare(
          a.completedAt ?? a.startedAt
        )
    )
    .slice(0, maxAttempts);

  let analyzedAttempts = 0;
  let skippedAttempts = 0;

  const uniqueQuestions = new Set<string>();

  for (const attempt of selectedAttempts) {
    const items = await getAttempt(
      attempt.attemptId
    );

    const metadata = items.find(
      (item) => item.SK === "META"
    );

    if (
      !metadata ||
      metadata.userId !== input.userId ||
      metadata.status !== "COMPLETED"
    ) {
      skippedAttempts++;
      continue;
    }

    const questionIds: string[] =
      metadata.questionIds ?? [];

    if (
      questionIds.length === 0 ||
      new Set(questionIds).size !==
        questionIds.length
    ) {
      skippedAttempts++;
      continue;
    }

    const catalogVersion =
      metadata.catalogVersion ?? "1.0.0";

    const questions = await getQuestionsByIds({
      questionIds,
      catalogVersion
    });

    const userAnswers =
      new Map<string, string[]>();

    const assignedQuestions =
      new Set(questionIds);

    for (const item of items) {
      if (
        typeof item.SK === "string" &&
        item.SK.startsWith("ANSWER#")
      ) {
        const questionId =
          item.SK.substring("ANSWER#".length);

        if (assignedQuestions.has(questionId)) {
          userAnswers.set(
            questionId,
            item.selectedAnswers ?? []
          );
        }
      }
    }

    for (const question of questions) {
      const selectedAnswers =
        userAnswers.get(
          question.questionId
        ) ?? [];

      const outcome = getOutcome(
        selectedAnswers,
        question.correctAnswers
      );

      incrementCounter(overall, outcome);

      uniqueQuestions.add(
        `${question.certificationId}#${question.questionId}`
      );

      // Exam domain
      if (question.examDomain) {
        addPerformance(
          byDomain,
          question.examDomain,
          outcome
        );
      }

      // Primary services
      const services = new Set(
        question.metadata.primary_services ?? []
      );

      for (const service of services) {
        addPerformance(
          byService,
          service,
          outcome
        );
      }

      // Concepts
      const concepts = new Set(
        question.metadata.concepts ?? []
      );

      for (const concept of concepts) {
        addPerformance(
          byConcept,
          concept,
          outcome
        );
      }

      // Question selection type
      addPerformance(
        bySelectCount,
        String(question.selectCount),
        outcome
      );

      // Difficulty
      if (question.metadata.difficulty) {
        addPerformance(
          byDifficulty,
          question.metadata.difficulty,
          outcome
        );
      }

      // Architecture patterns
      const patterns = new Set(
        question.metadata.architecture_patterns ?? []
      );

      for (const pattern of patterns) {
        addPerformance(
          byArchitecturePattern,
          pattern,
          outcome
        );
      }
    }

    analyzedAttempts++;
  }

  return {
    coverage: {
      totalCompletedAttempts:
        completedAttempts.length,

      selectedAttempts:
        selectedAttempts.length,

      analyzedAttempts,
      skippedAttempts,

      maxAttempts,

      truncated:
        completedAttempts.length >
        maxAttempts,

      uniqueQuestions:
        uniqueQuestions.size
    },

    overall: {
      ...overall,

      accuracy:
        calculateAccuracy(overall)
    },

    byDomain:
      formatPerformance(byDomain),

    byService:
      formatPerformance(byService),

    byConcept:
      formatPerformance(byConcept),

    bySelectCount:
      formatPerformance(bySelectCount)
        .map((item) => ({
          ...item,
          selectCount: Number(item.id)
        })),

    byDifficulty:
      formatPerformance(byDifficulty),

    byArchitecturePattern:
      formatPerformance(byArchitecturePattern)
  };
};