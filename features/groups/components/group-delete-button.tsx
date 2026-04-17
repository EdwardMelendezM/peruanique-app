"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { deleteGroup } from "../actions/group-actions";

interface GroupDeleteButtonProps {
  groupId: string;
  groupName: string;
  usersCount: number;
  roadmapNodesCount: number;
}

export function GroupDeleteButton({
  groupId,
  groupName,
  usersCount,
  roadmapNodesCount,
}: GroupDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = () => {
    const run = async () => {
      setIsPending(true);
      const result = await deleteGroup(groupId);
      setIsPending(false);

      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar el grupo");
        return;
      }

      toast.success(result.message ?? "Grupo eliminado correctamente");
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
        title="Eliminar grupo"
        description={
          <span>
            Se eliminará el grupo {groupName} de forma permanente.
            {usersCount + roadmapNodesCount > 0 ? (
              <>
                <br />
                También se eliminarán {usersCount} usuario(s) y {roadmapNodesCount} nodo(s) asociados.
              </>
            ) : null}
          </span>
        }
      />
    </>
  );
}

