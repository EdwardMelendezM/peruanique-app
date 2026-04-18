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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createLesson,
  updateLesson,
  type LessonActionState,
} from "../actions/lesson-actions";

export type LessonItem = {
  id: string;
  title: string;
  description: string | null;
  lessonType: string;
  questionsCount: number;
  updatedAt: Date;
};

interface LessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: LessonItem;
}

const initialState: LessonActionState = { success: false };

export function LessonModal({ open, onOpenChange, lesson }: LessonModalProps) {
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
              ? "Actualiza la información de la lección."
              : "Crea una nueva lección para agrupar preguntas de múltiples cursos."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="lessonId" value={lesson!.id} />}

          <div className="space-y-2">
            <Label htmlFor="title" className={cn(fieldErrors.title && "text-destructive")}>
              Título
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={lesson?.title}
              placeholder="Ej: Review Matemática Avanzada"
              disabled={isPending}
              className={cn(fieldErrors.title && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title && (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={cn(fieldErrors.description && "text-destructive")}>
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={lesson?.description ?? ""}
              placeholder="Describe el contenido de esta lección..."
              disabled={isPending}
              rows={4}
              className={cn(fieldErrors.description && "border-destructive focus-visible:ring-destructive")}
            />
            {fieldErrors.description && (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonType" className={cn(fieldErrors.lessonType && "text-destructive")}>
              Tipo de Lección
            </Label>
            <Select defaultValue={lesson?.lessonType ?? "GENERIC"} name="lessonType">
              <SelectTrigger id="lessonType" disabled={isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERIC">Genérica</SelectItem>
                <SelectItem value="REVIEW">Repaso</SelectItem>
                <SelectItem value="PRACTICE">Práctica</SelectItem>
                <SelectItem value="MIXED">Mixta</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.lessonType && (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.lessonType}</p>
            )}
          </div>

          {state.error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
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

