"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { removeQuestionFromLesson } from "../actions/lesson-questions-actions";
import { LessonQuestionsSelector } from "./lesson-questions-selector";
import { QuestionPreview } from "./question-preview";
import type { LessonDetailWithQuestionsAndAnswers, CourseItem } from "../actions/lesson-queries";

interface LessonQuestionsDetailProps {
  lesson: LessonDetailWithQuestionsAndAnswers;
  courses: CourseItem[];
  courseQuestionsMap?: Record<string, any>;
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

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MULTIPLE_CHOICE: "Opción múltiple",
    DRAG_AND_DROP: "Arrastra y suelta",
  };
  return labels[type] || type;
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

export function LessonQuestionsDetail({ lesson, courses, courseQuestionsMap = {} }: LessonQuestionsDetailProps) {
  const router = useRouter();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<
    (typeof lesson.questions[0]) | null
  >(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  const handleRemoveQuestion = async (lessonQuestionId: string, questionId: string) => {
    setRemoving(lessonQuestionId);
    const result = await removeQuestionFromLesson(lesson.id, questionId);
    setRemoving(null);

    if (result.success) {
      toast.success("Pregunta removida de la lección");
      router.refresh();
    } else {
      toast.error(result.error || "No se pudo remover la pregunta");
    }
  };

  const toggleExplanation = (questionId: string) => {
    setShowExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  if (lesson.questions.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyPlaceholder
          icon={Eye}
          title="Sin preguntas"
          description="Agrega preguntas a esta lección para comenzar."
          action={
            <Button onClick={() => setSelectorOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar preguntas
            </Button>
          }
        />
        <LessonQuestionsSelector
          lessonId={lesson.id}
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          courses={courses}
          existingQuestionIds={lesson.questions.map((q) => q.questionId)}
          courseQuestionsMap={courseQuestionsMap}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setSelectorOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar preguntas
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4">
          {lesson.questions.map((lq, index) => (
            <Card key={lq.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Pregunta {index + 1}
                      </span>
                      <Badge variant="outline">{lq.question.courseName}</Badge>
                      <Badge variant="secondary">{getTypeLabel(lq.question.type)}</Badge>
                      <Badge
                        variant="outline"
                        className={`${getDifficultyColor(lq.question.difficulty)} border`}
                      >
                        {getDifficultyLabel(lq.question.difficulty)}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {lq.question.questionText}
                    </p>
                    {lq.question.from && (
                      <p className="text-xs text-muted-foreground">Fuente: {lq.question.from}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewQuestion(lq)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={removing === lq.id}
                      onClick={() => handleRemoveQuestion(lq.id, lq.questionId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {lq.question.explanationText && (
                <CardContent className="space-y-3">
                  <button
                    onClick={() => toggleExplanation(lq.id)}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {showExplanations[lq.id] ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Ocultar explicación
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Ver explicación
                      </>
                    )}
                  </button>

                  {showExplanations[lq.id] && (
                    <div className="p-3 bg-muted rounded-md border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        {lq.question.explanationText}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}

              <CardContent className="pt-4 border-t">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Opciones de respuesta
                  </p>
                  <div className="space-y-2">
                    {lq.question.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className={`flex items-start gap-2 p-2 rounded text-sm ${
                          answer.isCorrect
                            ? "bg-green-100 border border-green-200 dark:border-green-500 dark:bg-green-900/20"
                            : "bg-gray-100 border border-gray-200 dark:border-gray-500 dark:bg-gray-900/20"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                            answer.isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {answer.isCorrect ? "✓" : "○"}
                        </span>
                        <span className="flex-1">{answer.answerText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <LessonQuestionsSelector
        lessonId={lesson.id}
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        courses={courses}
        existingQuestionIds={lesson.questions.map((q) => q.questionId)}
        courseQuestionsMap={courseQuestionsMap}
      />

      {previewQuestion && (
        <QuestionPreview
          question={previewQuestion.question}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
    </div>
  );
}

