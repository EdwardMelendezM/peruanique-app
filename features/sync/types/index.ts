// Tipado para los intentos que vienen del móvil
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