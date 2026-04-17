"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { deleteCourse } from "../actions/course-actions";

interface CourseDeleteButtonProps {
  courseId: string;
  courseName: string;
  lessonsCount: number;
}

export function CourseDeleteButton({ courseId, courseName, lessonsCount }: CourseDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteCourse(courseId);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar el curso");
        setIsPending(false);
        return;
      }

      toast.success(result.message ?? "Curso eliminado correctamente");
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
        title={`Eliminar ${courseName}`}
        description={
          <span>
            Esta acción eliminará el curso de forma permanente.
            {lessonsCount > 0 ? (
              <>
                <br />
                También se eliminarán sus {lessonsCount} lección(es) relacionadas por la relación en cascada.
              </>
            ) : null}
          </span>
        }
      />
    </>
  );
}

