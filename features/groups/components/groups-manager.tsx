"use client";

import { useState } from "react";
import { Plus, SquarePen, Users } from "lucide-react";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GroupListItem } from "../actions/group-queries";
import { GroupDeleteButton } from "./group-delete-button";
import { GroupModal } from "./group-modal";

interface GroupsManagerProps {
  groups: GroupListItem[];
}

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
};

export function GroupsManager({ groups }: GroupsManagerProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupListItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Grupos académicos</p>
          <p className="text-xs text-muted-foreground">{groups.length} grupo(s) registrados</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyPlaceholder
          icon={Users}
          title="No hay grupos registrados"
          description="Crea el primer grupo para asignar estudiantes y construir su roadmap."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear grupo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-5 items-center rounded-3xl bg-secondary px-2 text-xs font-medium text-secondary-foreground">
                        Grupo
                      </span>
                      <span className="inline-flex h-5 items-center rounded-3xl border border-border px-2 text-xs font-medium">
                        {group.usersCount} usuario(s)
                      </span>
                      <span className="inline-flex h-5 items-center rounded-3xl border border-border px-2 text-xs font-medium">
                        {group.roadmapNodesCount} nodo(s)
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group.description || "Sin descripción"}</p>
                    <p className="text-xs text-muted-foreground">Actualizado {formatDate(group.updatedAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingGroup(group)}>
                      <SquarePen className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <GroupDeleteButton
                      groupId={group.id}
                      groupName={group.name}
                      usersCount={group.usersCount}
                      roadmapNodesCount={group.roadmapNodesCount}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GroupModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      <GroupModal
        key={editingGroup ? `group-${editingGroup.id}` : "group-empty"}
        open={Boolean(editingGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGroup(null);
          }
        }}
        group={editingGroup ?? undefined}
      />
    </div>
  );
}

