"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { deleteAnswer } from "../../actions/question-answer-actions";

interface AnswerDeleteButtonProps {
  courseId: string;
  questionId: string;
  answerId: string;
  answerText: string;
}

export function AnswerDeleteButton({
  courseId,
  questionId,
  answerId,
  answerText,
}: AnswerDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteAnswer(courseId, questionId, answerId);
      setIsPending(false);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar la respuesta");
        return;
      }

      toast.success(result.message ?? "Respuesta eliminada");
      setOpen(false);
      router.refresh();
    };

    void run();
  };

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </Button>
      <ConfirmModal
        isOpen={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        loading={isPending}
        title="Eliminar respuesta"
        description={`Se eliminará la respuesta "${answerText}".`}
      />
    </>
  );
}

