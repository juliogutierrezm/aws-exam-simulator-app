// src/app/core/models/question.model.ts

export interface QuestionOption {
  id: string;
  text: string;
}

export interface SourceQuestion {
  scenario: string;
  options: QuestionOption[];
}

export interface QuestionMetadata {
  primary_services?: string[];
  mentioned_services?: string[];
  concepts?: string[];
  architecture_patterns?: string[];
  difficulty?: QuestionDifficulty;
  question_style?: string;
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionFeedback {
  summary: string;
  incorrect_options: string;
  key_clue: string;
}

export interface Question {
  schema_version?: string;
  id: string;
  exam_id: string;
  bank_index: number;
  exam: string;
  source_question_number: number;
  topic: string;
  exam_domain: string;
  select_count: number;
  source_question?: SourceQuestion;
  source_correct_answers?: string[];
  generated_question?: SourceQuestion;
  generated_correct_answers?: string[];
  feedback?: QuestionFeedback;
  metadata?: QuestionMetadata;
  references?: string[];
  source_image?: string | null;
  notes?: string | null;
}
