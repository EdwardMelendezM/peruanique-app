"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import LatexRenderer from "@/components/ui/latex-renderer"
import { cn } from "@/lib/utils"
import {
  createQuestion,
  updateQuestion,
  type QuestionActionState,
} from "../../actions/question-answer-actions"
import {
  difficultyValues,
  questionTypeValues,
} from "../../schemas/question-answer-schemas"
import type { CourseQuestionItem } from "../../actions/course-content-queries"

interface QuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  question?: CourseQuestionItem
}

const initialState: QuestionActionState = {
  success: false,
}

const difficultyLabel: Record<(typeof difficultyValues)[number], string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
  PROFESSIONAL: "Profesional",
}

const questionTypeLabel: Record<(typeof questionTypeValues)[number], string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  DRAG_AND_DROP: "Arrastrar y soltar",
  LONG_TEXT: "Texto largo",
  MATH_EXPRESSION: "Expresión matemática",
  IMAGE_BASED: "Basada en imagen",
}

export function QuestionModal({
  open,
  onOpenChange,
  courseId,
  question,
}: QuestionModalProps) {
  const router = useRouter()
  const action = question ? updateQuestion : createQuestion
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (!state.success) {
      return
    }

    toast.success(
      state.message ?? (question ? "Pregunta actualizada" : "Pregunta creada")
    )
    onOpenChange(false)
    router.refresh()
  }, [onOpenChange, question, router, state.message, state.success])

  const fieldErrors = state.fieldErrors ?? {}
  const isEdit = Boolean(question)
  const [selectedType, setSelectedType] = useState<string>(
    question?.type ?? "MULTIPLE_CHOICE"
  )
  const [metadataText, setMetadataText] = useState<string>(
    question?.metadata ? JSON.stringify(question.metadata) : ""
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar pregunta" : "Nueva pregunta"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la pregunta y su configuración pedagógica."
              : "Crea una nueva pregunta dentro de una lección del curso."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          {question ? (
            <input type="hidden" name="questionId" value={question.id} />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="difficulty"
                className={cn(fieldErrors.difficulty && "text-destructive")}
              >
                Dificultad
              </Label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue={question?.difficulty ?? "BEGINNER"}
                className={cn(
                  "h-10 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm",
                  fieldErrors.difficulty && "border-destructive"
                )}
                aria-invalid={Boolean(fieldErrors.difficulty)}
                disabled={isPending}
              >
                {difficultyValues.map((value) => (
                  <option key={value} value={value}>
                    {difficultyLabel[value]}
                  </option>
                ))}
              </select>
              {fieldErrors.difficulty ? (
                <p className="text-xs font-semibold text-destructive">
                  {fieldErrors.difficulty}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="type"
                className={cn(fieldErrors.type && "text-destructive")}
              >
                Tipo
              </Label>
              <select
                id="type"
                name="type"
                defaultValue={question?.type ?? "MULTIPLE_CHOICE"}
                onChange={(e) => setSelectedType(e.target.value)}
                className={cn(
                  "h-10 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm",
                  fieldErrors.type && "border-destructive"
                )}
                aria-invalid={Boolean(fieldErrors.type)}
                disabled={isPending}
              >
                {questionTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {questionTypeLabel[value]}
                  </option>
                ))}
              </select>
              {fieldErrors.type ? (
                <p className="text-xs font-semibold text-destructive">
                  {fieldErrors.type}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="questionText"
              className={cn(fieldErrors.questionText && "text-destructive")}
            >
              Pregunta
            </Label>
            <Textarea
              id="questionText"
              name="questionText"
              rows={4}
              defaultValue={question?.questionText ?? ""}
              placeholder="Escribe el enunciado de la pregunta"
              className={cn(
                fieldErrors.questionText &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={Boolean(fieldErrors.questionText)}
              disabled={isPending}
            />
            {fieldErrors.questionText ? (
              <p className="text-xs font-semibold text-destructive">
                {fieldErrors.questionText}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="explanationText"
              className={cn(fieldErrors.explanationText && "text-destructive")}
            >
              Explicación (opcional)
            </Label>
            <Textarea
              id="explanationText"
              name="explanationText"
              rows={3}
              defaultValue={question?.explanationText ?? ""}
              placeholder="Texto de explicación para el estudiante"
              className={cn(
                fieldErrors.explanationText &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={Boolean(fieldErrors.explanationText)}
              disabled={isPending}
            />
            {fieldErrors.explanationText ? (
              <p className="text-xs font-semibold text-destructive">
                {fieldErrors.explanationText}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="metadata"
              className={cn(fieldErrors.metadata && "text-destructive")}
            >
              Metadata (JSON) - Opcional
            </Label>
            <Textarea
              id="metadata"
              name="metadata"
              rows={4}
              value={metadataText}
              onChange={(e) => setMetadataText(e.target.value)}
              placeholder='JSON opcional para tipos especiales. Ej: {"imageUrl":"/img/x.png"} o coordenadas.'
              className={cn(
                fieldErrors.metadata &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={Boolean(fieldErrors.metadata)}
              disabled={isPending}
            />
            {selectedType === "IMAGE_BASED" ? (
              <p className="text-xs text-muted-foreground">
                Para preguntas basadas en imagen, guarde en metadata la URL o
                datos relevantes.
              </p>
            ) : null}
            {selectedType === "MATH_EXPRESSION" ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Para expresiones matemáticas, puede guardar la expresión en
                  metadata.latex o en la respuesta. Ej:{" "}
                  {`{"latex":"x^2 + 3x - 10 = 0"}`}
                </p>
                <div className="mt-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Previsualización:
                  </div>
                  {/* Try to parse metadataText as JSON and render metadata.latex or fallback to raw text */}
                  {(() => {
                    if (!metadataText || metadataText.trim() === "")
                      return (
                        <div className="text-xs text-muted-foreground">
                          No hay contenido para previsualizar.
                        </div>
                      )
                    try {
                      const parsed = JSON.parse(metadataText)
                      if (parsed && typeof parsed.latex === "string") {
                        return (
                          <LatexRenderer
                            latex={parsed.latex}
                            className="mt-1"
                          />
                        )
                      }
                      // If parsed but no latex field, try render raw metadata as string
                      return (
                        <div className="text-xs text-muted-foreground">
                          No se encontró la clave `latex` en el JSON.
                        </div>
                      )
                    } catch (e) {
                      // If it's not valid JSON, treat metadataText as raw LaTeX
                      return (
                        <LatexRenderer latex={metadataText} className="mt-1" />
                      )
                    }
                  })()}
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="from"
              className={cn(fieldErrors.from && "text-destructive")}
            >
              Fuente / procedencia (opcional)
            </Label>
            <Textarea
              id="from"
              name="from"
              rows={2}
              defaultValue={question?.from ?? ""}
              placeholder='Ej: "UNSAAC ORD 2023-I" o "Banco interno"'
              className={cn(
                fieldErrors.from &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={Boolean(fieldErrors.from)}
              disabled={isPending}
            />
            {fieldErrors.from ? (
              <p className="text-xs font-semibold text-destructive">
                {fieldErrors.from}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {state.error}
            </p>
          ) : null}

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
              {isPending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear pregunta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
