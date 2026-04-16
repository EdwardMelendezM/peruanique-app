# Skill: nextjs-table-generator

## 🎯 Purpose
Generar tablas de gestión de datos utilizando `shadcn/ui`, integrando acciones de fila protegidas por el componente `ConfirmModal` para garantizar eliminaciones seguras y una experiencia de usuario (UX) premium.

## 📝 Execution Protocol
1. **Shadcn Integration**: Usar `@/components/ui/table` y `@/components/ui/dropdown-menu`.
2. **Safe Deletion Hook**:
  - Implementar un estado `isDeleteModalOpen` y `recordToDelete` (ID del registro).
  - Usar el componente `@/components/confirm-modal` (ConfirmModal) para envolver la acción de borrado.
  - La accion de borrado debe importarse desde `../actions/delete-[model]` (sin sufijo `.action`).
3. **Optimistic Feedback**: Usar `toast.promise` de Sonner vinculado a la Server Action de eliminación.
4. **Post-Mutation Sync**: Tras exito, ejecutar `router.refresh()` para sincronizar la UI con el estado revalidado del servidor.
5. **Visual Consistency**:
  - Iconos de `lucide-react` para acciones (`MoreHorizontal`, `Pencil`, `Trash2`).
  - Badges para estados o categorías.

## 🚫 Constraints
- **NO BROWSER CONFIRM**: Está estrictamente prohibido usar `window.confirm()`. Usar siempre `ConfirmModal`.
- **LOADING STATES**: El botón de confirmación del modal debe mostrar el `Loader2` mediante la prop `loading`.
- **RESPONSIVE**: Envolver la tabla en un contenedor con `overflow-x-auto`.
