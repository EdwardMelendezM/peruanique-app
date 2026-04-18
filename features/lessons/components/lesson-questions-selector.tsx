"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { addQuestionToLesson } from "../actions/lesson-questions-actions";
import type { CourseItem } from "../actions/lesson-queries";

interface LessonQuestionsSelectorProps {
  lessonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: CourseItem[];
  existingQuestionIds?: string[];
  courseQuestionsMap?: Record<string, any>;
}

interface CourseQuestion {
  id: string;
  questionText: string;
  explanationText: string | null;
  from: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  type: "MULTIPLE_CHOICE" | "DRAG_AND_DROP";
  answers: Array<{
    id: string;
    answerText: string;
    isCorrect: boolean;
  }>;
}

const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    BEGINNER: "Principiante",
    INTERMEDIATE: "Intermedio",
    ADVANCED: "Avanzado",
    PROFESSIONAL: "Profesional",
  };
  return labels[difficulty] || difficulty;
};

export function LessonQuestionsSelector({
  lessonId,
  open,
  onOpenChange,
  courses,
  existingQuestionIds = [],
  courseQuestionsMap = {},
}: LessonQuestionsSelectorProps) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courseQuestions, setCourseQuestions] = useState<CourseQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setCourseQuestions([]);
    setSelectedQuestionIds(new Set());
    setSearchTerm("");

    if (!courseId) return;

    // Check if we have pre-fetched data
    if (courseQuestionsMap[courseId]) {
      setCourseQuestions(courseQuestionsMap[courseId]);
      return;
    }

    // Otherwise, we would need to fetch (but since we pre-fetch on server, this shouldn't happen)
    // For now, just show empty list
    toast.error("Las preguntas no están disponibles");
  };

  const handleQuestionToggle = (questionId: string) => {
    const newSelected = new Set(selectedQuestionIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestionIds(newSelected);
  };

  const handleAddQuestions = async () => {
    if (selectedQuestionIds.size === 0) {
      toast.error("Selecciona al menos una pregunta");
      return;
    }

    setIsAdding(true);
    try {
      const results = await Promise.all(
        Array.from(selectedQuestionIds).map((questionId) =>
          addQuestionToLesson(lessonId, questionId)
        )
      );

      const allSuccess = results.every((r) => r.success);
      const successCount = results.filter((r) => r.success).length;

      if (allSuccess) {
        toast.success(`${successCount} pregunta(s) agregada(s) a la lección`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(`Se agregaron ${successCount} de ${results.length} preguntas`);
      }
    } catch {
      toast.error("Error agregando preguntas");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredQuestions = courseQuestions.filter((q) =>
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableQuestions = filteredQuestions.filter(
    (q) => !existingQuestionIds.includes(q.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="minx-w-2xl max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar preguntas a la lección</DialogTitle>
          <DialogDescription>
            Selecciona un curso y luego las preguntas que deseas agregar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Course Selector */}
          <div className="space-y-2">
            <Label htmlFor="course-select">Selecciona un curso</Label>
            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger id="course-select" disabled={isLoadingCourse}>
                <SelectValue placeholder="Elige un curso..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          {selectedCourseId && (
            <div className="space-y-2">
              <Label htmlFor="search">Buscar preguntas</Label>
              <Input
                id="search"
                placeholder="Busca por texto de pregunta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoadingCourse}
              />
            </div>
          )}

          {/* Questions List */}
          {selectedCourseId && (
            <div className="flex-1 overflow-hidden flex flex-col border rounded-lg">
              {isLoadingCourse ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {courseQuestions.length === 0
                    ? "Este curso no tiene preguntas"
                    : "No hay preguntas disponibles (todas ya están en la lección)"}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {availableQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`q-${question.id}`}
                          checked={selectedQuestionIds.has(question.id)}
                          onCheckedChange={() => handleQuestionToggle(question.id)}
                          disabled={isAdding}
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <label
                            htmlFor={`q-${question.id}`}
                            className="text-sm leading-relaxed cursor-pointer block"
                          >
                            {question.questionText}
                          </label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getDifficultyLabel(question.difficulty)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {question.type === "MULTIPLE_CHOICE"
                                ? "Opción múltiple"
                                : "Arrastra y suelta"}
                            </Badge>
                            {question.from && (
                              <span className="text-xs text-muted-foreground">{question.from}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Selection Summary */}
          {selectedCourseId && (
            <div className="text-sm text-muted-foreground">
              {selectedQuestionIds.size === 0
                ? "Selecciona al menos una pregunta"
                : `${selectedQuestionIds.size} pregunta(s) seleccionada(s)`}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddQuestions}
            disabled={selectedQuestionIds.size === 0 || isAdding || !selectedCourseId}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              `Agregar ${selectedQuestionIds.size > 0 ? selectedQuestionIds.size : ""} pregunta(s)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

