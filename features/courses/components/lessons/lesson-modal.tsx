"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createLesson,
  updateLesson,
  type LessonActionState,
} from "../../actions/lesson-actions";
import type { CourseLessonItem } from "../../actions/course-lesson-queries";

interface LessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lesson?: CourseLessonItem;
}

const initialState: LessonActionState = {
  success: false,
};

export function LessonModal({ open, onOpenChange, courseId, lesson }: LessonModalProps) {
  const router = useRouter();
  const action = lesson ? updateLesson : createLesson;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    toast.success(state.message ?? (lesson ? "Lección actualizada" : "Lección creada"));
    onOpenChange(false);
    router.refresh();
  }, [lesson, onOpenChange, router, state.message, state.success]);

  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = Boolean(lesson);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lección" : "Nueva lección"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos de la lección seleccionada."
              : "Crea una lección dentro del curso para organizar preguntas."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          {lesson ? <input type="hidden" name="lessonId" value={lesson.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="title" className={cn(fieldErrors.title && "text-destructive")}>
              Título
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={lesson?.title ?? ""}
              placeholder="Distribuciones Numéricas"
              className={cn(fieldErrors.title && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={Boolean(fieldErrors.title)}
              disabled={isPending}
            />
            {fieldErrors.title ? <p className="text-xs font-semibold text-destructive">{fieldErrors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={cn(fieldErrors.description && "text-destructive")}>
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={lesson?.description ?? ""}
              placeholder="Describe brevemente el objetivo de la lección"
              className={cn(fieldErrors.description && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={Boolean(fieldErrors.description)}
              disabled={isPending}
            />
            {fieldErrors.description ? (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.description}</p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear lección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

