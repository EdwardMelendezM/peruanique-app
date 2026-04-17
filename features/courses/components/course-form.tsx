"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CourseActionState } from "../actions/course-actions";

interface CourseFormValues {
  id?: string;
  name: string;
  colorTheme: string | null;
  iconUrl: string | null;
}

interface CourseFormProps {
  mode: "create" | "edit";
  action: (state: CourseActionState, formData: FormData) => Promise<CourseActionState>;
  initialValues?: Partial<CourseFormValues>;
  submitLabel?: string;
}

const initialState: CourseActionState = {
  success: false,
};

export function CourseForm({ mode, action, initialValues, submitLabel }: CourseFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    toast.success(state.message ?? (mode === "create" ? "Curso creado correctamente" : "Curso actualizado correctamente"));
    router.push("/admin/courses");
    router.refresh();
  }, [mode, router, state.message, state.success]);

  const fieldErrors = state.fieldErrors ?? {};
  const title = mode === "create" ? "Nuevo curso" : "Editar curso";
  const description =
    mode === "create"
      ? "Registra un nuevo curso para la biblioteca global."
      : "Actualiza los datos del curso seleccionado.";

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className={cn(fieldErrors.name && "text-destructive")}>Nombre del curso</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialValues?.name ?? ""}
          placeholder="Razonamiento Matemático"
          aria-invalid={Boolean(fieldErrors.name)}
          className={cn(fieldErrors.name && "border-destructive focus-visible:ring-destructive")}
        />
        {fieldErrors.name ? <p className="text-xs font-semibold text-destructive">{fieldErrors.name}</p> : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="colorTheme" className={cn(fieldErrors.colorTheme && "text-destructive")}>
            Color tema
          </Label>
          <Input
            id="colorTheme"
            name="colorTheme"
            defaultValue={initialValues?.colorTheme ?? ""}
            placeholder="#0ea5e9 o bg-sky-500"
            aria-invalid={Boolean(fieldErrors.colorTheme)}
            className={cn(fieldErrors.colorTheme && "border-destructive focus-visible:ring-destructive")}
          />
          <p className="text-xs text-muted-foreground">Opcional. Puedes usar un color hex o un token de estilo.</p>
          {fieldErrors.colorTheme ? <p className="text-xs font-semibold text-destructive">{fieldErrors.colorTheme}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="iconUrl" className={cn(fieldErrors.iconUrl && "text-destructive")}>
            URL del ícono
          </Label>
          <Input
            id="iconUrl"
            name="iconUrl"
            defaultValue={initialValues?.iconUrl ?? ""}
            placeholder="https://..."
            aria-invalid={Boolean(fieldErrors.iconUrl)}
            className={cn(fieldErrors.iconUrl && "border-destructive focus-visible:ring-destructive")}
          />
          <p className="text-xs text-muted-foreground">Opcional. Ideal para mostrar el curso con una imagen o icono externo.</p>
          {fieldErrors.iconUrl ? <p className="text-xs font-semibold text-destructive">{fieldErrors.iconUrl}</p> : null}
        </div>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? "Guardando..." : submitLabel ?? (mode === "create" ? "Crear curso" : "Guardar cambios")}
        </Button>
      </div>
    </form>
  );
}

