import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

export type RoadmapNodeListItem = {
  id: string;
  groupId: string;
  lessonId: string;
  orderIndex: number;
  lessonTitle: string;
  progressCount: number;
  attemptsCount: number;
  updatedAt: Date;
};

export type RoadmapGroupOption = {
  id: string;
  name: string;
};

export type RoadmapLessonOption = {
  id: string;
  title: string;
};

export type RoadmapNodesData = {
  groups: RoadmapGroupOption[];
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  lessons: RoadmapLessonOption[];
  nodes: RoadmapNodeListItem[];
};

const toLessonOption = (lesson: { id: string; title: string }): RoadmapLessonOption => ({
  id: lesson.id,
  title: lesson.title,
});

export async function getRoadmapNodesData(
  selectedGroupId?: string
): Promise<{ success: true; data: RoadmapNodesData } | { success: false; error: string }> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const [groups, lessons] = await Promise.all([
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.lesson.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  if (!effectiveGroupId) {
    return {
      success: true,
      data: {
        groups,
        selectedGroupId: null,
        selectedGroupName: null,
        lessons: lessons.map(toLessonOption),
        nodes: [],
      },
    };
  }

  const selectedGroup = groups.find((group) => group.id === effectiveGroupId) ?? groups[0];
  if (!selectedGroup) {
    return {
      success: true,
      data: {
        groups,
        selectedGroupId: null,
        selectedGroupName: null,
        lessons: lessons.map(toLessonOption),
        nodes: [],
      },
    };
  }

  const nodes = await prisma.roadmapNode.findMany({
    where: {
      groupId: selectedGroup.id,
    },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      groupId: true,
      lessonId: true,
      orderIndex: true,
      updatedAt: true,
      lesson: {
        select: {
          title: true,
        },
      },
      _count: {
        select: {
          userProgress: true,
          attempts: true,
        },
      },
    },
  });

  return {
    success: true,
    data: {
      groups,
      selectedGroupId: selectedGroup.id,
      selectedGroupName: selectedGroup.name,
      lessons: lessons.map(toLessonOption),
      nodes: nodes.map((node) => ({
        id: node.id,
        groupId: node.groupId,
        lessonId: node.lessonId,
        orderIndex: node.orderIndex,
        lessonTitle: node.lesson.title,
        progressCount: node._count.userProgress,
        attemptsCount: node._count.attempts,
        updatedAt: node.updatedAt,
      })),
    },
  };
}

