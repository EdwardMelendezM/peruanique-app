import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { RoadmapNodesData } from "../actions/roadmap-node-queries";
import { RoadmapNodesManager } from "../components/roadmap-nodes-manager";

interface RoadmapNodesScreenProps {
  data: RoadmapNodesData;
}

export function RoadmapNodesScreen({ data }: RoadmapNodesScreenProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Constructor de roadmap"
        description="Organiza la secuencia de lecciones por grupo usando nodos ordenados."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a cursos
            </Link>
          </Button>
        }
      />

      <RoadmapNodesManager
        groups={data.groups}
        selectedGroupId={data.selectedGroupId}
        selectedGroupName={data.selectedGroupName}
        lessons={data.lessons}
        nodes={data.nodes}
      />
    </div>
  );
}

