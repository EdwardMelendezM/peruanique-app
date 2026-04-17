"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, Plus, SquarePen } from "lucide-react";
import type {
  RoadmapGroupOption,
  RoadmapLessonOption,
  RoadmapNodeListItem,
} from "../actions/roadmap-node-queries";
import { RoadmapNodeDeleteButton } from "./roadmap-node-delete-button";
import { RoadmapNodeModal } from "./roadmap-node-modal";

interface RoadmapNodesManagerProps {
  groups: RoadmapGroupOption[];
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  lessons: RoadmapLessonOption[];
  nodes: RoadmapNodeListItem[];
}

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
};

export function RoadmapNodesManager({
  groups,
  selectedGroupId,
  selectedGroupName,
  lessons,
  nodes,
}: RoadmapNodesManagerProps) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<RoadmapNodeListItem | null>(null);

  const handleGroupChange = (groupId: string) => {
    router.push(`/admin/roadmap?groupId=${groupId}`);
  };

  if (groups.length === 0) {
    return (
      <EmptyPlaceholder
        icon={GitBranch}
        title="No hay grupos disponibles"
        description="Primero crea grupos para definir un roadmap por cohorte."
        action={
          <Button asChild>
            <Link href="/admin/groups">Gestionar grupos</Link>
          </Button>
        }
      />
    );
  }

  if (!selectedGroupId || !selectedGroupName) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
        Selecciona un grupo para administrar su roadmap.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3">
        <div className="space-y-2">
          <label htmlFor="groupId" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Grupo
          </label>
          <select
            id="groupId"
            value={selectedGroupId}
            onChange={(event) => handleGroupChange(event.target.value)}
            className="h-10 min-w-64 rounded-2xl border border-transparent bg-input/50 px-3 text-sm"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/groups">Grupos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/courses">Ver cursos y lecciones</Link>
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} disabled={lessons.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo nodo
          </Button>
        </div>
      </div>

      {lessons.length === 0 ? (
        <EmptyPlaceholder
          icon={GitBranch}
          title="No hay lecciones disponibles"
          description="Crea lecciones en cursos para poder construir este roadmap."
        />
      ) : nodes.length === 0 ? (
        <EmptyPlaceholder
          icon={GitBranch}
          title="Este grupo aún no tiene nodos"
          description="Agrega el primer nodo del roadmap para iniciar la secuencia de estudio."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear nodo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {nodes.map((node) => (
            <Card key={node.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Orden {node.orderIndex}</Badge>
                      <Badge variant="outline">{node.lessonCourseName}</Badge>
                      <Badge variant="outline">Progreso: {node.progressCount}</Badge>
                      <Badge variant="outline">Intentos: {node.attemptsCount}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{node.lessonTitle}</h3>
                    <p className="text-xs text-muted-foreground">Actualizado {formatDate(node.updatedAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingNode(node)}>
                      <SquarePen className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <RoadmapNodeDeleteButton
                      groupId={selectedGroupId}
                      nodeId={node.id}
                      lessonTitle={node.lessonTitle}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoadmapNodeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        groupId={selectedGroupId}
        lessons={lessons}
      />

      <RoadmapNodeModal
        key={editingNode ? `roadmap-node-${editingNode.id}` : "roadmap-node-empty"}
        open={Boolean(editingNode)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNode(null);
          }
        }}
        groupId={selectedGroupId}
        lessons={lessons}
        node={editingNode ?? undefined}
      />
    </div>
  );
}

