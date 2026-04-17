"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { deleteQuestion } from "../../actions/question-answer-actions";

interface QuestionDeleteButtonProps {
  courseId: string;
  questionId: string;
  questionText: string;
}

export function QuestionDeleteButton({ courseId, questionId, questionText }: QuestionDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteQuestion(courseId, questionId);
      setIsPending(false);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar la pregunta");
        return;
      }

      toast.success(result.message ?? "Pregunta eliminada");
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
        title="Eliminar pregunta"
        description={`Se eliminará la pregunta "${questionText}" y todas sus respuestas.`}
      />
    </>
  );
}

