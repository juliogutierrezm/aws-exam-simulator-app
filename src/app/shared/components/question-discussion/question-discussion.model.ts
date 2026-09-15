export interface QuestionDiscussion {
  questionId: string;
  comments: DiscussionComment[];
}

export interface DiscussionComment {
  id: string;
  authorName: string;
  authorRole?: string;
  authorInitials: string;
  content: string;
  supportedOptionId?: string;
  referenceUrl?: string;
  helpfulCount: number;
  createdAtLabel: string;
  isTeamResponse: boolean;
  replies: DiscussionComment[];
}
