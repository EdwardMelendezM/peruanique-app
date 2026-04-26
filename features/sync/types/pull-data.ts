export interface SyncAttemptPushBody {
  attempts: LessonAttempt[]; // Los LessonAttempt que vienen del móvil
  userProgress: UserProgress[];
  syncQueues: SyncQueue[]
}

export interface SyncQueue {
  id: number;
  type: string;
  amount: number;
  createdAt: string;
  status: 'pending'
}

export interface UserProgress {
  id: string;
  userId: string;
  nodeId: string;
  status: string;
  scoreObtained: number;
  starsEarned: number;
}

export interface LessonAttempt {
  id: string; // El UUID generado en el móvil
  userId: string;
  nodeId: string;
  questionId: string;
  selectedAnswerId: string;
  isCorrect: boolean;
  timeSeconds: number;
  answeredAt: Date; // ISO Date
}

export interface BaseEntity {
  id: string;
  updatedAt: number; // Timestamp para SQLite
}

export interface SyncCourse extends BaseEntity {
  name: string;
  colorTheme: string | null;
  iconUrl: string | null;
}

export interface SyncLesson extends BaseEntity {
  title: string;
  description: string | null;
  lessonType: LessonType;
  isDisabled: boolean;
}

export interface SyncQuestion extends BaseEntity {
  courseId: string;
  questionText: string;
  explanationText: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  from: string | null;
  isDisabled: boolean;
}

export interface SyncAnswer {
  id: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  isDisabled: boolean;
}

export interface SyncRoadmapNode extends BaseEntity {
  groupId: string;
  lessonId: string;
  orderIndex: number;
}

export interface SyncLessonQuestion extends BaseEntity {
  lessonId: string;
  questionId: string;
  orderIndex: number;
  isDisabled: boolean;
}

export interface SyncUserProfile {
  userId: string;
  full_name: string;
  targetUniversity: string | null;
  currentLevelTag: string;
  totalXp: number;
  streakDays: number;
}

export interface SyncUserProgress {
  id: string;
  userId: string;
  nodeId: string;
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
  scoreObtained: number;
  starsEarned: number;
  updatedAt: number; // Viene del server como timestamp
}

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
export type QuestionType = 'MULTIPLE_CHOICE' | 'DRAG_AND_DROP';
export type LessonType = 'GENERIC' | 'REVIEW' | 'PRACTICE' | 'MIXED';

export interface OfflineContent {
  courses: SyncCourse[];
  lessons: SyncLesson[];
  questions: SyncQuestion[];
  answers: SyncAnswer[];
  roadmap: SyncRoadmapNode[];
  lessonQuestions: SyncLessonQuestion[];
  userProfile: SyncUserProfile | null;
  userProgress: SyncUserProgress[];
}

export interface OfflineCheck {
  success: boolean;
  needsUpdate: boolean;
  changes: string[];
  serverTime: string;
}

export interface OfflineStatsContent {
  status: boolean;
  data: {
    attemptsSyncedIds: string[];
    userProgressSyncedIds: string[];
    syncQueueIds: number[];
  }
}

export interface SyncOptions {
  groupId: string;
  userId: string;
  domains: string[];
}