"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpenCheck, CircleCheck, CircleX, MessageSquare, Plus, SquarePen } from "lucide-react";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnswerDeleteButton } from "./answer-delete-button";
import { AnswerModal } from "./answer-modal";
import { QuestionDeleteButton } from "./question-delete-button";
import { QuestionModal } from "./question-modal";
import type {
  CourseLessonWithQuestions,
  CourseQuestionItem,
  CourseAnswerItem,
} from "../../actions/course-content-queries";

interface CourseQuestionsManagerProps {
  courseId: string;
  courseName: string;
  lessons: CourseLessonWithQuestions[];
}

interface AnswerModalState {
  open: boolean;
  question: CourseQuestionItem | null;
  answer?: CourseAnswerItem;
}

const difficultyLabel: Record<CourseQuestionItem["difficulty"], string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
  PROFESSIONAL: "Profesional",
};

const typeLabel: Record<CourseQuestionItem["type"], string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  DRAG_AND_DROP: "Arrastrar y soltar",
};

export function CourseQuestionsManager({ courseId, courseName, lessons }: CourseQuestionsManagerProps) {
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CourseQuestionItem | null>(null);
  const [answerModal, setAnswerModal] = useState<AnswerModalState>({
    open: false,
    question: null,
  });

  const questionCount = useMemo(() => {
    return lessons.reduce((count, lesson) => count + lesson.questions.length, 0);
  }, [lessons]);

  const hasLessons = lessons.length > 0;
  const hasQuestions = questionCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Curso: {courseName}</p>
          <p className="text-xs text-muted-foreground">
            {questionCount} pregunta(s) distribuidas en {lessons.length} lección(es)
          </p>
        </div>
        <Button onClick={() => setCreateQuestionOpen(true)} disabled={!hasLessons}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva pregunta
        </Button>
      </div>

      {!hasLessons ? (
        <EmptyPlaceholder
          icon={BookOpenCheck}
          title="No hay lecciones en este curso"
          description="Primero crea lecciones para poder registrar preguntas y respuestas."
          action={
            <Button asChild>
              <Link href={`/admin/courses/${courseId}/lessons`}>Gestionar lecciones</Link>
            </Button>
          }
        />
      ) : !hasQuestions ? (
        <EmptyPlaceholder
          icon={MessageSquare}
          title="No hay preguntas todavía"
          description="Crea la primera pregunta del curso y luego agrega sus respuestas."
          action={
            <Button onClick={() => setCreateQuestionOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear pregunta
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base">{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {lesson.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Esta lección no tiene preguntas todavía.</p>
                ) : (
                  lesson.questions.map((question) => (
                    <div key={question.id} className="space-y-3 rounded-2xl border border-border/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{difficultyLabel[question.difficulty]}</Badge>
                            <Badge variant="outline">{typeLabel[question.type]}</Badge>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{question.questionText}</p>
                          {question.from ? (
                            <p className="text-xs text-muted-foreground">Fuente: {question.from}</p>
                          ) : null}
                          {question.explanationText ? (
                            <p className="text-xs text-muted-foreground">{question.explanationText}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAnswerModal({ open: true, question })}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Respuesta
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingQuestion(question)}
                          >
                            <SquarePen className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <QuestionDeleteButton
                            courseId={courseId}
                            questionId={question.id}
                            questionText={question.questionText}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {question.answers.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Aún no hay respuestas para esta pregunta.</p>
                        ) : (
                          question.answers.map((answer) => (
                            <div
                              key={answer.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                {answer.isCorrect ? (
                                  <CircleCheck className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <CircleX className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span>{answer.answerText}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAnswerModal({ open: true, question, answer })}
                                >
                                  <SquarePen className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>
                                <AnswerDeleteButton
                                  courseId={courseId}
                                  questionId={question.id}
                                  answerId={answer.id}
                                  answerText={answer.answerText}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestionModal
        open={createQuestionOpen}
        onOpenChange={setCreateQuestionOpen}
        courseId={courseId}
        lessons={lessons}
      />

      <QuestionModal
        key={editingQuestion ? `edit-question-${editingQuestion.id}` : "edit-question-empty"}
        open={Boolean(editingQuestion)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingQuestion(null);
          }
        }}
        courseId={courseId}
        lessons={lessons}
        question={editingQuestion ?? undefined}
      />

      <AnswerModal
        key={
          answerModal.question
            ? `answer-${answerModal.question.id}-${answerModal.answer?.id ?? "new"}`
            : "answer-empty"
        }
        open={answerModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setAnswerModal({ open: false, question: null });
          }
        }}
        courseId={courseId}
        question={answerModal.question}
        answer={answerModal.answer}
      />
    </div>
  );
}

