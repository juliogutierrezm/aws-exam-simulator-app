// src/app/core/models/aws-service.model.ts

export interface AwsService {
  id: string;
  name: string;
  short_name: string;
  category: string;
  icon_key: string;
  question_count: number;
  mentioned_question_count: number;
}
