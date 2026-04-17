import { getRoadmapNodesData } from "@/features/roadmap/actions/roadmap-node-queries";
import { RoadmapNodesScreen } from "@/features/roadmap/screens/roadmap-nodes-screen";

type RoadmapPageProps = {
  searchParams?: Promise<{
    groupId?: string;
  }>;
};

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const result = await getRoadmapNodesData(params?.groupId);

  if (!result.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-muted-foreground">
        {result.error}
      </div>
    );
  }

  return <RoadmapNodesScreen data={result.data} />;
}

