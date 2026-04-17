"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import {
  createGroupSchema,
  deleteGroupSchema,
  updateGroupSchema,
  type CreateGroupInput,
  type UpdateGroupInput,
} from "../schemas/group-schemas";

type GroupField = "groupId" | "name" | "description";

export type GroupActionState = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<GroupField, string>>;
};

const getStringValue = (value: FormDataEntryValue | null) => {
  return typeof value === "string" ? value : "";
};

const mapCreateData = (formData: FormData): CreateGroupInput => ({
  name: getStringValue(formData.get("name")),
  description: getStringValue(formData.get("description")),
});

const mapUpdateData = (formData: FormData): UpdateGroupInput => ({
  groupId: getStringValue(formData.get("groupId")),
  name: getStringValue(formData.get("name")),
  description: getStringValue(formData.get("description")),
});

const revalidateGroups = () => {
  revalidatePath("/admin/groups");
  revalidatePath("/admin/roadmap");
};

export async function createGroup(
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = createGroupSchema.safeParse(mapCreateData(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<GroupActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "description") {
        fieldErrors[key] = issue.message;
      }
    }

    return { success: false, error: "Revisa los campos marcados", fieldErrors };
  }

  await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  revalidateGroups();

  return { success: true, message: "Grupo creado correctamente" };
}

export async function updateGroup(
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = updateGroupSchema.safeParse(mapUpdateData(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<GroupActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "groupId" || key === "name" || key === "description") {
        fieldErrors[key] = issue.message;
      }
    }

    return { success: false, error: "Revisa los campos marcados", fieldErrors };
  }

  const group = await prisma.group.findUnique({
    where: { id: parsed.data.groupId },
    select: { id: true },
  });

  if (!group) {
    return { success: false, error: "El grupo no existe" };
  }

  await prisma.group.update({
    where: { id: parsed.data.groupId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  revalidateGroups();

  return { success: true, message: "Grupo actualizado correctamente" };
}

export async function deleteGroup(groupId: string): Promise<GroupActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = deleteGroupSchema.safeParse({ groupId });
  if (!parsed.success) {
    return { success: false, error: "Solicitud inválida" };
  }

  const group = await prisma.group.findUnique({
    where: { id: parsed.data.groupId },
    select: {
      id: true,
      _count: {
        select: {
          users: true,
          roadmap: true,
        },
      },
    },
  });

  if (!group) {
    return { success: false, error: "El grupo no existe" };
  }

  await prisma.group.delete({ where: { id: parsed.data.groupId } });

  revalidateGroups();

  const cascaded = group._count.users + group._count.roadmap;
  return {
    success: true,
    message:
      cascaded > 0
        ? `Grupo eliminado junto con ${cascaded} registro(s) relacionados`
        : "Grupo eliminado correctamente",
  };
}

