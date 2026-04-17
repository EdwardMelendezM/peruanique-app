"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpenCheck, MessageSquare, Plus, SquarePen } from "lucide-react";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseLessonItem } from "../../actions/course-lesson-queries";
import { LessonDeleteButton } from "./lesson-delete-button";
import { LessonModal } from "./lesson-modal";

interface CourseLessonsManagerProps {
  courseId: string;
  courseName: string;
  lessons: CourseLessonItem[];
}

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
};

export function CourseLessonsManager({ courseId, courseName, lessons }: CourseLessonsManagerProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLessonItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Curso: {courseName}</p>
          <p className="text-xs text-muted-foreground">{lessons.length} lección(es) registradas</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva lección
        </Button>
      </div>

      {lessons.length === 0 ? (
        <EmptyPlaceholder
          icon={BookOpenCheck}
          title="Este curso aún no tiene lecciones"
          description="Crea una lección para poder registrar preguntas y respuestas dentro del curso."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear lección
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Lección</Badge>
                      <Badge variant="outline">{lesson.questionsCount} pregunta(s)</Badge>
                      <Badge variant="outline">Actualizada {formatDate(lesson.updatedAt)}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{lesson.title}</h3>
                    {lesson.description ? (
                      <p className="text-sm text-muted-foreground">{lesson.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin descripción</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/courses/${courseId}/questions`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Preguntas
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      <SquarePen className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <LessonDeleteButton
                      courseId={courseId}
                      lessonId={lesson.id}
                      lessonTitle={lesson.title}
                      questionsCount={lesson.questionsCount}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LessonModal open={createModalOpen} onOpenChange={setCreateModalOpen} courseId={courseId} />

      <LessonModal
        key={editingLesson ? `edit-lesson-${editingLesson.id}` : "edit-lesson-empty"}
        open={Boolean(editingLesson)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLesson(null);
          }
        }}
        courseId={courseId}
        lesson={editingLesson ?? undefined}
      />
    </div>
  );
}

