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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createAnswer,
  updateAnswer,
  type AnswerActionState,
} from "../../actions/question-answer-actions";
import type { CourseAnswerItem, CourseQuestionItem } from "../../actions/course-content-queries";

interface AnswerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  question: CourseQuestionItem | null;
  answer?: CourseAnswerItem;
}

const initialState: AnswerActionState = {
  success: false,
};

export function AnswerModal({ open, onOpenChange, courseId, question, answer }: AnswerModalProps) {
  const router = useRouter();
  const action = answer ? updateAnswer : createAnswer;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    toast.success(state.message ?? (answer ? "Respuesta actualizada" : "Respuesta creada"));
    onOpenChange(false);
    router.refresh();
  }, [answer, onOpenChange, router, state.message, state.success]);

  if (!question) {
    return null;
  }

  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = Boolean(answer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar respuesta" : "Nueva respuesta"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la respuesta seleccionada."
              : "Registra una nueva respuesta para la pregunta actual."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="questionId" value={question.id} />
          {answer ? <input type="hidden" name="answerId" value={answer.id} /> : null}

          <div className="rounded-2xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Pregunta: {question.questionText}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answerText" className={cn(fieldErrors.answerText && "text-destructive")}>
              Respuesta
            </Label>
            <Textarea
              id="answerText"
              name="answerText"
              rows={3}
              defaultValue={answer?.answerText ?? ""}
              placeholder="Escribe una alternativa de respuesta"
              className={cn(fieldErrors.answerText && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={Boolean(fieldErrors.answerText)}
              disabled={isPending}
            />
            {fieldErrors.answerText ? (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.answerText}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="isCorrect"
              defaultChecked={answer?.isCorrect ?? false}
              className="h-4 w-4"
              disabled={isPending}
            />
            Marcar como correcta
          </label>

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
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear respuesta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

