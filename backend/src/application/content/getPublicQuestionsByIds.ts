import {
  getQuestionsByIds
} from "./getQuestionsByIds.js";

type GetPublicQuestionsByIdsInput = {
  questionIds: string[];
  catalogVersion: string;
};

export type PublicAttemptQuestion = {
  questionId: string;
  examId: string;
  certificationId: string;
  catalogVersion: string;

  selectCount: number;
  examDomain: string;

  question: {
    scenario: string;
    options: Array<{
      id: string;
      text: string;
    }>;
  };
};

export const getPublicQuestionsByIds = async (
  input: GetPublicQuestionsByIdsInput
): Promise<PublicAttemptQuestion[]> => {
  const questions = await getQuestionsByIds({
    questionIds: input.questionIds,
    catalogVersion: input.catalogVersion
  });

  return questions.map((item) => ({
    questionId: item.questionId,
    examId: item.examId,
    certificationId: item.certificationId,
    catalogVersion: item.catalogVersion,

    selectCount: item.selectCount,
    examDomain: item.examDomain,

    question: {
      scenario: item.question.scenario,

      options: item.question.options.map(
        (option) => ({
          id: option.id,
          text: option.text
        })
      )
    }
  }));
};