import { z } from "zod";

const roadmapNodeIdSchema = z.string().uuid("Identificador de nodo inválido");
const groupIdSchema = z.string().uuid("Grupo inválido");
const lessonIdSchema = z.string().uuid("Lección inválida");

export const createRoadmapNodeSchema = z.object({
  groupId: groupIdSchema,
  lessonId: lessonIdSchema,
  orderIndex: z
    .coerce
    .number({ message: "El orden es requerido" })
    .int("El orden debe ser un entero")
    .min(1, "El orden debe ser mayor o igual a 1"),
});

export const updateRoadmapNodeSchema = createRoadmapNodeSchema.extend({
  nodeId: roadmapNodeIdSchema,
});

export const deleteRoadmapNodeSchema = z.object({
  groupId: groupIdSchema,
  nodeId: roadmapNodeIdSchema,
});

export type CreateRoadmapNodeInput = z.infer<typeof createRoadmapNodeSchema>;
export type UpdateRoadmapNodeInput = z.infer<typeof updateRoadmapNodeSchema>;

