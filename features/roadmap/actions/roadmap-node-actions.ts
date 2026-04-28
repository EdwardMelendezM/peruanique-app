"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/get-session"
import {
  createRoadmapNodeSchema,
  deleteRoadmapNodeSchema,
  updateRoadmapNodeSchema,
} from "../schemas/roadmap-node-schemas"
import { markAsDirty } from "@/features/sync/actions/notify-change"
import { SYNC_DOMAINS } from "@/conts"
import { Question } from "@/app/generated/prisma/client"

type RoadmapNodeField = "groupId" | "nodeId" | "lessonId" | "orderIndex"

export type RoadmapNodeActionState = {
  success: boolean
  message?: string
  error?: string
  fieldErrors?: Partial<Record<RoadmapNodeField, string>>
}

const getStringValue = (value: FormDataEntryValue | null) => {
  return typeof value === "string" ? value : ""
}

const mapCreateData = (formData: FormData) => ({
  groupId: getStringValue(formData.get("groupId")),
  lessonId: getStringValue(formData.get("lessonId")),
  orderIndex: getStringValue(formData.get("orderIndex")),
})

const mapUpdateData = (formData: FormData) => ({
  nodeId: getStringValue(formData.get("nodeId")),
  groupId: getStringValue(formData.get("groupId")),
  lessonId: getStringValue(formData.get("lessonId")),
  orderIndex: getStringValue(formData.get("orderIndex")),
})

const revalidateRoadmap = () => {
  revalidatePath("/admin/roadmap")
}

const validateUniqueOrderIndex = async (
  groupId: string,
  orderIndex: number,
  nodeId?: string
): Promise<string | null> => {
  const existingNode = await prisma.roadmapNode.findFirst({
    where: {
      groupId,
      orderIndex,
      ...(nodeId ? { id: { not: nodeId } } : {}),
    },
    select: { id: true },
  })

  return existingNode ? "Ya existe un nodo con ese orden para este grupo" : null
}

export async function createRoadmapNode(
  _state: RoadmapNodeActionState,
  formData: FormData
): Promise<RoadmapNodeActionState> {
  const session = await getSession()
  if (!session.success) {
    return { success: false, error: "No autorizado" }
  }

  const parsed = createRoadmapNodeSchema.safeParse(mapCreateData(formData))
  if (!parsed.success) {
    const fieldErrors: NonNullable<RoadmapNodeActionState["fieldErrors"]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (key === "groupId" || key === "lessonId" || key === "orderIndex") {
        fieldErrors[key] = issue.message
      }
    }

    return { success: false, error: "Revisa los campos marcados", fieldErrors }
  }

  const [group, lesson] = await Promise.all([
    prisma.group.findUnique({
      where: { id: parsed.data.groupId },
      select: { id: true },
    }),
    prisma.lesson.findUnique({
      where: { id: parsed.data.lessonId },
      select: { id: true, questions: true },
    }),
  ])

  const questionsIds =
    lesson?.questions?.map((question) => question.questionId) || []
  const courses = await prisma.course.findMany({
    where: {
      questions: {
        some: {
          id: { in: questionsIds },
        },
      },
    },
  })
  const courseIds = courses.map((course) => course.id)
  const setCourseIds = new Set(courseIds)

  if (!group) {
    return {
      success: false,
      error: "El grupo no existe",
      fieldErrors: { groupId: "Grupo inválido" },
    }
  }

  if (!lesson) {
    return {
      success: false,
      error: "La lección no existe",
      fieldErrors: { lessonId: "Lección inválida" },
    }
  }

  const uniqueOrderError = await validateUniqueOrderIndex(
    parsed.data.groupId,
    parsed.data.orderIndex
  )
  if (uniqueOrderError) {
    return {
      success: false,
      error: uniqueOrderError,
      fieldErrors: { orderIndex: uniqueOrderError },
    }
  }

  await prisma.roadmapNode.create({
    data: {
      groupId: parsed.data.groupId,
      lessonId: parsed.data.lessonId,
      orderIndex: parsed.data.orderIndex,
    },
  })

  for (const courseId of setCourseIds) {
    await markAsDirty(SYNC_DOMAINS.QUESTIONS(courseId))
  }
  await markAsDirty(SYNC_DOMAINS.ROADMAP(group.id))
  revalidateRoadmap()

  return { success: true, message: "Nodo creado correctamente" }
}

export async function updateRoadmapNode(
  _state: RoadmapNodeActionState,
  formData: FormData
): Promise<RoadmapNodeActionState> {
  const session = await getSession()
  if (!session.success) {
    return { success: false, error: "No autorizado" }
  }

  const parsed = updateRoadmapNodeSchema.safeParse(mapUpdateData(formData))
  if (!parsed.success) {
    const fieldErrors: NonNullable<RoadmapNodeActionState["fieldErrors"]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (
        key === "groupId" ||
        key === "nodeId" ||
        key === "lessonId" ||
        key === "orderIndex"
      ) {
        fieldErrors[key] = issue.message
      }
    }

    return { success: false, error: "Revisa los campos marcados", fieldErrors }
  }

  const existingNode = await prisma.roadmapNode.findFirst({
    where: {
      id: parsed.data.nodeId,
      groupId: parsed.data.groupId,
    },
    select: { id: true, groupId: true },
  })

  if (!existingNode) {
    return {
      success: false,
      error: "El nodo no existe o no pertenece al grupo",
    }
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: { id: true },
  })

  if (!lesson) {
    return {
      success: false,
      error: "La lección no existe",
      fieldErrors: { lessonId: "Lección inválida" },
    }
  }

  const uniqueOrderError = await validateUniqueOrderIndex(
    parsed.data.groupId,
    parsed.data.orderIndex,
    parsed.data.nodeId
  )
  if (uniqueOrderError) {
    return {
      success: false,
      error: uniqueOrderError,
      fieldErrors: { orderIndex: uniqueOrderError },
    }
  }

  await prisma.roadmapNode.update({
    where: { id: parsed.data.nodeId },
    data: {
      lessonId: parsed.data.lessonId,
      orderIndex: parsed.data.orderIndex,
    },
  })

  await markAsDirty(SYNC_DOMAINS.ROADMAP(existingNode.groupId))
  revalidateRoadmap()

  return { success: true, message: "Nodo actualizado correctamente" }
}

export async function deleteRoadmapNode(
  groupId: string,
  nodeId: string
): Promise<RoadmapNodeActionState> {
  const session = await getSession()
  if (!session.success) {
    return { success: false, error: "No autorizado" }
  }

  const parsed = deleteRoadmapNodeSchema.safeParse({ groupId, nodeId })
  if (!parsed.success) {
    return { success: false, error: "Solicitud inválida" }
  }

  const node = await prisma.roadmapNode.findFirst({
    where: {
      id: parsed.data.nodeId,
      groupId: parsed.data.groupId,
    },
    select: {
      id: true,
      groupId: true,
      _count: {
        select: {
          userProgress: true,
          attempts: true,
        },
      },
    },
  })

  if (!node) {
    return {
      success: false,
      error: "El nodo no existe o no pertenece al grupo",
    }
  }

  await prisma.roadmapNode.delete({ where: { id: parsed.data.nodeId } })

  await markAsDirty(SYNC_DOMAINS.ROADMAP(node.groupId))
  revalidateRoadmap()

  const dependents = node._count.userProgress + node._count.attempts

  return {
    success: true,
    message:
      dependents > 0
        ? `Nodo eliminado junto con ${dependents} registros relacionados`
        : "Nodo eliminado correctamente",
  }
}
