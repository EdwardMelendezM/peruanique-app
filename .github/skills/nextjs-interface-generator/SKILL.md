# Skill: nextjs-interface-generator

## 🎯 Purpose
Generar formularios interactivos y validados que sigan el patrón estético de la Sociedad de Debate, integrando Server Actions con manejo de errores granulares y feedback visual mediante Sonner.

## 📝 Execution Protocol
1. **Schema Linkage**: El formulario debe importar su schema desde `@/features/[domain]/schemas/`.
2. **Server Action Linkage**: Importar la accion desde `@/features/[domain]/actions/[name]` (sin sufijo `.action`).
3. **State Management**: Usar `useForm` con `zodResolver`.
4. **Smart Feedback (Sonner)**:
  - Usar `toast.error` para errores globales o de conexión.
  - Usar `toast.success` solo en acciones críticas de éxito que no redirijan inmediatamente.
5. **Error Mapping**: Si el `result.success` es falso y existen `fieldErrors`, mapearlos al formulario usando `setError`.
6. **Loading UI**: Implementar el estado `isSubmitting` para deshabilitar el `Button` y mostrar el `Loader2`.

## 🚫 Constraints
- No usar etiquetas `<input>` nativas para campos principales; usar el wrapper `@/components/form-field`.
- Mantener consistencia en el diseño de botones: `h-14` y `font-bold`.
- Usar `lucide-react` para todos los iconos de los campos.
- Evitar `any` al mapear `fieldErrors`; usar tipos de `react-hook-form` (ej. `Path<T>`).
