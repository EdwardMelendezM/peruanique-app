export interface LessonAttemptInput {
  id: string; // El UUID generado en el móvil
  userId: string;
  nodeId: string;
  questionId: string;
  selectedAnswerId: string;
  isCorrect: boolean;
  timeSeconds: number;
  answeredAt: Date; // ISO Date
}

export interface UserProgressInput {
  id: string;
  userId: string;
  nodeId: string;
  status: string;
  scoreObtained: number;
  starsEarned: number;
}

export interface SyncQueueInput {
  id: number;
  type: string;
  amount: number;
  current: number;
  createdAt: string | Date;
  status: string;
}