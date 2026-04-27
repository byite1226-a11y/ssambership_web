export const coreDomainTables = {
  identity: ["users", "mentor_profiles", "subscriptions"],
  qna: ["mentor_student_rooms", "question_threads", "question_messages", "connection_notes"],
  community: ["community_posts", "shortform_posts", "comments"],
  ops: ["payments", "refunds", "notifications", "audit_logs"],
} as const;

export const qnaHierarchy = ["room", "thread", "message", "connection note"] as const;
