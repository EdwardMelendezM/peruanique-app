export const SYNC_DOMAINS = {
  ROADMAP: (groupId: string) => `ROADMAP:${groupId}`,
  COURSES_CONTENT: "COURSES_CONTENT",
  QUESTIONS: (courseId: string) => `QUESTIONS:${courseId}`,
  GLOBAL_CONFIG: "GLOBAL_CONFIG",
};