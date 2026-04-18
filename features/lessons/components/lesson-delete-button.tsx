"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { deleteLesson } from "../actions/lesson-actions";

interface LessonDeleteButtonProps {
  lessonId: string;
  lessonTitle: string;
  questionsCount: number;
}

export function LessonDeleteButton({ lessonId, lessonTitle, questionsCount }: LessonDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteLesson(lessonId);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar la lección");
        setIsPending(false);
        return;
      }

      toast.success(result.message ?? "Lección eliminada correctamente");
      setIsOpen(false);
      setIsPending(false);
      router.refresh();
    };

    void run();
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </Button>

      <ConfirmModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleConfirm}
        loading={isPending}
        title={`Eliminar ${lessonTitle}`}
        description={
          <span>
            Esta acción eliminará la lección de forma permanente.
            {questionsCount > 0 ? (
              <>
                <br />
                También se eliminarán sus {questionsCount} pregunta(s) relacionadas por la relación en cascada.
              </>
            ) : null}
          </span>
        }
      />
    </>
  );
}

