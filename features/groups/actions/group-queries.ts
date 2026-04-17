import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

export type GroupListItem = {
  id: string;
  name: string;
  description: string | null;
  usersCount: number;
  roadmapNodesCount: number;
  updatedAt: Date;
};

export async function getGroups(): Promise<{ success: true; groups: GroupListItem[] } | { success: false; error: string }> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          roadmap: true,
        },
      },
    },
  });

  return {
    success: true,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      usersCount: group._count.users,
      roadmapNodesCount: group._count.roadmap,
      updatedAt: group.updatedAt,
    })),
  };
}

