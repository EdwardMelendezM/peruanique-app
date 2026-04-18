"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus, SquarePen } from "lucide-react";
import { LessonModal, type LessonItem } from "./lesson-modal";
import { LessonDeleteButton } from "./lesson-delete-button";

interface LessonManagerProps {
  lessons: LessonItem[];
}

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
};

const getLessonTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    GENERIC: "Genérica",
    REVIEW: "Repaso",
    PRACTICE: "Práctica",
    MIXED: "Mixta",
  };
  return labels[type] || type;
};

export function LessonManager({ lessons }: LessonManagerProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);

  if (lessons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva lección
          </Button>
        </div>

        <EmptyPlaceholder
          icon={BookOpen}
          title="No hay lecciones"
          description="Crea la primera lección para agrupar preguntas de múltiples cursos."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear lección
            </Button>
          }
        />

        <LessonModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva lección
        </Button>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{lesson.title}</h3>
                    <Badge variant="outline">{getLessonTypeLabel(lesson.lessonType)}</Badge>
                  </div>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Actualizado {formatDate(lesson.updatedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
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
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    questionsCount={lesson.questionsCount}
                  />
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/lessons/${lesson.id}/questions`}>
                      Ver preguntas
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <LessonModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      <LessonModal
        key={editingLesson ? `lesson-${editingLesson.id}` : "lesson-empty"}
        open={Boolean(editingLesson)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLesson(null);
          }
        }}
        lesson={editingLesson ?? undefined}
      />
    </div>
  );
}

