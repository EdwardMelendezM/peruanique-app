"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface QuestionPreviewProps {
  question: {
    id: string;
    questionText: string;
    explanationText: string | null;
    difficulty: string;
    type: string;
    from: string | null;
    courseName: string;
    answers: Array<{
      id: string;
      answerText: string;
      isCorrect: boolean;
    }>;
  };
  onClose: () => void;
}

const getDifficultyColor = (difficulty: string) => {
  const colors: Record<string, string> = {
    BEGINNER: "bg-green-500/10 text-green-700 border-green-200",
    INTERMEDIATE: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    ADVANCED: "bg-orange-500/10 text-orange-700 border-orange-200",
    PROFESSIONAL: "bg-red-500/10 text-red-700 border-red-200",
  };
  return colors[difficulty] || "bg-gray-500/10 text-gray-700 border-gray-200";
};

const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    BEGINNER: "Principiante",
    INTERMEDIATE: "Intermedio",
    ADVANCED: "Avanzado",
    PROFESSIONAL: "Profesional",
  };
  return labels[difficulty] || difficulty;
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MULTIPLE_CHOICE: "Opción múltiple",
    DRAG_AND_DROP: "Arrastra y suelta",
  };
  return labels[type] || type;
};

export function QuestionPreview({ question, onClose }: QuestionPreviewProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle>Vista previa de pregunta</DialogTitle>
              <DialogDescription>Detalles completos de la pregunta</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{question.courseName}</Badge>
              <Badge variant="secondary">{getTypeLabel(question.type)}</Badge>
              <Badge
                variant="outline"
                className={`${getDifficultyColor(question.difficulty)} border`}
              >
                {getDifficultyLabel(question.difficulty)}
              </Badge>
              {question.from && (
                <span className="text-xs text-muted-foreground self-center">
                  Fuente: {question.from}
                </span>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Pregunta</p>
            <p className="text-base leading-relaxed">{question.questionText}</p>
          </div>

          {/* Answers */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Opciones de respuesta</p>
            <div className="space-y-2">
              {question.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    answer.isCorrect
                      ? "bg-green-50 border-green-200 dark:bg-green-100 text-white dark:text-black"
                      : "bg-gray-50 border-gray-200 dark:bg-gray-500"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold flex-shrink-0 ${
                      answer.isCorrect
                        ? "bg-green-500 border-green-500"
                        : "bg-gray-300 border-gray-200"
                    }`}
                  >
                    {answer.isCorrect ? "✓" : "○"}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{answer.answerText}</p>
                    {answer.isCorrect && (
                      <p className="text-xs font-semibold text-green-700">Respuesta correcta</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          {question.explanationText && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Explicación</p>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 leading-relaxed">
                  {question.explanationText}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

