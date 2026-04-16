# Skill: nextjs-server-action-generator

## 🎯 Purpose
Generar Server Actions de Next.js con enfoque de caso de uso para `features/[feature]/actions/[name].ts`, asegurando validacion Zod, seguridad con sesion y tipado estricto del resultado.

## 📝 Execution Protocol
1. **Path Convention**: Crear el archivo en `features/[feature]/actions/[name].ts`.
2. **Server Boundary**: Iniciar siempre con `"use server"`.
3. **Validation First**: Parsear input al inicio con Zod (`safeParse`) y devolver errores de campos cuando aplique.
4. **Auth Guard**: Verificar sesion con `getSession()` o helper equivalente antes de cualquier mutacion/lectura sensible.
5. **Data Access**: Usar `prisma` desde `@/lib/prisma` con `select/include` minimo necesario.
6. **Typed Contract**: Definir un union type de retorno (`success: true | false`) para manejo predecible en UI.
7. **Cache Strategy**: En mutaciones, ejecutar `revalidatePath` para mantener consistencia en Server Components.
8. **Error Handling**: Loguear con tag estable (`[ACTION_NAME_ERROR]`) y responder mensaje seguro para cliente.

## 🚫 Constraints
- No usar API routes para logica interna; usar exclusivamente Server Actions.
- No usar `any`; preferir tipos de Prisma o interfaces explicitas.
- No exponer errores internos/crudos al cliente.
- Si se devuelve fecha al cliente, serializar a ISO string.

