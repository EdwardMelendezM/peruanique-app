import { z } from "zod";

const groupIdSchema = z.string().uuid("Identificador de grupo inválido");

const optionalDescriptionSchema = z
  .union([z.string().trim().max(1000, "La descripción es demasiado larga"), z.literal("")])
  .transform((value) => (value === "" ? null : value));

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no debe superar los 120 caracteres"),
  description: optionalDescriptionSchema,
});

export const updateGroupSchema = createGroupSchema.extend({
  groupId: groupIdSchema,
});

export const deleteGroupSchema = z.object({
  groupId: groupIdSchema,
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

