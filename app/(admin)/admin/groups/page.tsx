import { getGroups } from "@/features/groups/actions/group-queries";
import { GroupsScreen } from "@/features/groups/screens/groups-screen";

export default async function GroupsPage() {
  const result = await getGroups();

  if (!result.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-muted-foreground">
        {result.error}
      </div>
    );
  }

  return <GroupsScreen groups={result.groups} />;
}

