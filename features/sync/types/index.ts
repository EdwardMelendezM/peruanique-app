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

export interface SyncOptions {
  groupId: string;
  userId: string;
  domains: string[]; // Ej: ["ROADMAP:uuid", "QUESTIONS:course-uuid"]
}

// Estructura de retorno para el cliente (Drizzle compatible)
export interface OfflineData {
  courses?: any[];
  lessons?: any[];
  questions?: any[];
  answers?: any[];
  roadmap?: any[];
  lessonQuestions?: any[];
  userProfile?: any;
  userProgress?: any[];
}