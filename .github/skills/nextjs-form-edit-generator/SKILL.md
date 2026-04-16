# Skill: nextjs-form-edit-generator

## 🎯 Purpose
Generar formularios de edición que carguen datos existentes de Prisma, permitan su modificación con validación Zod y ejecuten `updateAction` con feedback de Sonner.

## 📝 Execution Protocol
1. **Data Hydration**: El componente debe recibir un prop `initialData` (el objeto de la DB).
2. **Hook Reset**: Usar `defaultValues` en `useForm` con los datos de `initialData`.
3. **Dirty State**: (Opcional) Bloquear el botón de envío si el formulario no ha sido modificado (`isDirty`).
4. **Server Action Path**: Importar la accion desde `@/features/[domain]/actions/[name]` (sin sufijo `.action`).
5. **Action Routing**: Al terminar con éxito, usar `router.refresh()` para actualizar los datos en la tabla y opcionalmente `router.back()`.

## 🚫 Constraints
- Usar el componente `@/components/form-field`.
- No olvidar el `id` oculto o pasarlo directamente a la Server Action.
