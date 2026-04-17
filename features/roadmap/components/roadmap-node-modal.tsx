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
import { cn } from "@/lib/utils";
import {
  createRoadmapNode,
  updateRoadmapNode,
  type RoadmapNodeActionState,
} from "../actions/roadmap-node-actions";
import type {
  RoadmapLessonOption,
  RoadmapNodeListItem,
} from "../actions/roadmap-node-queries";

interface RoadmapNodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  lessons: RoadmapLessonOption[];
  node?: RoadmapNodeListItem;
}

const initialState: RoadmapNodeActionState = { success: false };

export function RoadmapNodeModal({ open, onOpenChange, groupId, lessons, node }: RoadmapNodeModalProps) {
  const router = useRouter();
  const action = node ? updateRoadmapNode : createRoadmapNode;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    toast.success(state.message ?? (node ? "Nodo actualizado" : "Nodo creado"));
    onOpenChange(false);
    router.refresh();
  }, [node, onOpenChange, router, state.message, state.success]);

  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = Boolean(node);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar nodo" : "Nuevo nodo"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la lección y orden de este nodo en el roadmap."
              : "Agrega una nueva lección al roadmap del grupo seleccionado."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="groupId" value={groupId} />
          {node ? <input type="hidden" name="nodeId" value={node.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="lessonId" className={cn(fieldErrors.lessonId && "text-destructive")}>
              Lección
            </Label>
            <select
              id="lessonId"
              name="lessonId"
              defaultValue={node?.lessonId ?? lessons[0]?.id ?? ""}
              className={cn(
                "h-10 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm",
                fieldErrors.lessonId && "border-destructive"
              )}
              aria-invalid={Boolean(fieldErrors.lessonId)}
              disabled={lessons.length === 0 || isPending}
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.courseName} - {lesson.title}
                </option>
              ))}
            </select>
            {fieldErrors.lessonId ? <p className="text-xs font-semibold text-destructive">{fieldErrors.lessonId}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderIndex" className={cn(fieldErrors.orderIndex && "text-destructive")}>
              Orden
            </Label>
            <Input
              id="orderIndex"
              name="orderIndex"
              type="number"
              min={1}
              defaultValue={node?.orderIndex ?? 1}
              className={cn(fieldErrors.orderIndex && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={Boolean(fieldErrors.orderIndex)}
              disabled={isPending}
            />
            {fieldErrors.orderIndex ? (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.orderIndex}</p>
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
            <Button type="submit" disabled={isPending || lessons.length === 0}>
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear nodo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

