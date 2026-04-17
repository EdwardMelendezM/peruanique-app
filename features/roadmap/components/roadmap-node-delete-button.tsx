"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { deleteRoadmapNode } from "../actions/roadmap-node-actions";

interface RoadmapNodeDeleteButtonProps {
  groupId: string;
  nodeId: string;
  lessonTitle: string;
}

export function RoadmapNodeDeleteButton({ groupId, nodeId, lessonTitle }: RoadmapNodeDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteRoadmapNode(groupId, nodeId);
      setIsPending(false);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar el nodo");
        return;
      }

      toast.success(result.message ?? "Nodo eliminado correctamente");
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
        title="Eliminar nodo"
        description={`Se eliminará el nodo de la lección ${lessonTitle}.`}
      />
    </>
  );
}

