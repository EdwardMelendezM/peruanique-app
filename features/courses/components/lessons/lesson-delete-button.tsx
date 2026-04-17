"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { deleteLesson } from "../../actions/lesson-actions";

interface LessonDeleteButtonProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  questionsCount: number;
}

export function LessonDeleteButton({
  courseId,
  lessonId,
  lessonTitle,
  questionsCount,
}: LessonDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteLesson(courseId, lessonId);
      setIsPending(false);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar la lección");
        return;
      }

      toast.success(result.message ?? "Lección eliminada correctamente");
      setOpen(false);
      router.refresh();
    };

    void run();
  };

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </Button>
      <ConfirmModal
        isOpen={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        loading={isPending}
        title="Eliminar lección"
        description={
          <span>
            Se eliminará la lección {lessonTitle} de forma permanente.
            {questionsCount > 0 ? (
              <>
                <br />
                También se eliminarán sus {questionsCount} pregunta(s) y respuestas asociadas.
              </>
            ) : null}
          </span>
        }
      />
    </>
  );
}

