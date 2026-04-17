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
import { cn } from "@/lib/utils";
import { createGroup, updateGroup, type GroupActionState } from "../actions/group-actions";
import type { GroupListItem } from "../actions/group-queries";

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: GroupListItem;
}

const initialState: GroupActionState = { success: false };

export function GroupModal({ open, onOpenChange, group }: GroupModalProps) {
  const router = useRouter();
  const action = group ? updateGroup : createGroup;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    toast.success(state.message ?? (group ? "Grupo actualizado" : "Grupo creado"));
    onOpenChange(false);
    router.refresh();
  }, [group, onOpenChange, router, state.message, state.success]);

  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = Boolean(group);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la información del grupo académico."
              : "Crea un nuevo grupo para asociar usuarios y roadmap."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {group ? <input type="hidden" name="groupId" value={group.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="name" className={cn(fieldErrors.name && "text-destructive")}>
              Nombre
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={group?.name ?? ""}
              placeholder="Grupo A"
              className={cn(fieldErrors.name && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={isPending}
            />
            {fieldErrors.name ? <p className="text-xs font-semibold text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={cn(fieldErrors.description && "text-destructive")}>
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={group?.description ?? ""}
              placeholder="Descripción del grupo o cohorte"
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
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

