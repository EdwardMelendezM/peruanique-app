import { prisma } from "@/lib/prisma"

export async function getRoadmapData(groupId: string) {
  const nodes = await prisma.roadmapNode.findMany({
    where: { groupId },
    include: { lesson: true },
    orderBy: { orderIndex: "asc" },
  });

  return {
    roadmap: nodes.map(({ lesson, ...node }) => ({
      ...node,
      updatedAt: node.updatedAt.getTime(),
    })),
    lessons: nodes.map(n => ({
      ...n.lesson,
      updatedAt: n.lesson.updatedAt.getTime(),
    })),
  };
}