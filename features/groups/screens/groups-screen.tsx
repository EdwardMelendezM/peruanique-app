import Link from "next/link";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { GroupsManager } from "../components/groups-manager";
import type { GroupListItem } from "../actions/group-queries";

interface GroupsScreenProps {
  groups: GroupListItem[];
}

export function GroupsScreen({ groups }: GroupsScreenProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Grupos"
        description="Administra grupos académicos para usuarios y roadmaps."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/roadmap">
                <GitBranch className="mr-2 h-4 w-4" />
                Ir a roadmap
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </>
        }
      />

      <GroupsManager groups={groups} />
    </div>
  );
}

