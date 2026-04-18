# 🌱 Guía de Seeds - Refactorización Many-to-Many

## 📋 Descripción General

Los seeds han sido actualizados para reflejar la nueva estructura where:
- **Cursos** contienen **Preguntas** directamente (con `courseId`)
- **Lecciones** son independientes y agrupan preguntas via `LessonQuestion` (many-to-many)

---

## 🔄 Cambios en los Seeds

### ANTES (Estructura Vieja)
```typescript
// ❌ Lecciones ligadas a cursos
const lesson = await prisma.lesson.create({
  data: {
    courseId: course.id,  // ❌ Ya no existe
  },
});

// ❌ Preguntas ligadas a lecciones
const question = await prisma.question.create({
  data: {
    lessonId: lesson.id,  // ❌ Ya no existe
  },
});
```

### AHORA (Estructura Nueva)
```typescript
// ✅ Lecciones independientes
const lesson = await prisma.lesson.create({
  data: {
    title: "...",
    // Sin courseId
  },
});

// ✅ Preguntas ligadas a cursos
const question = await prisma.question.create({
  data: {
    courseId: course.id,  // ✅ Directo del curso
  },
});

// ✅ Relación many-to-many
await prisma.lessonQuestion.create({
  data: {
    lessonId: lesson.id,
    questionId: question.id,
    orderIndex: 0,
  },
});
```

---

## 📁 Archivos de Seeds

### 1. **main-seed.ts** ✅ ACTUALIZADO
**Propósito:** Carga datos JSON del directorio `/data`

**Cambios:**
- Ahora crea lecciones SIN `courseId`
- Preguntas se crean con `courseId` directo del curso
- Relaciones many-to-many en `lessonQuestion`
- Mejor logging con emojis

**Uso:**
```bash
bun run seed:main
# o
npm run seed:main
```

---

### 2. **improved-seed.ts** ✅ NUEVO
**Propósito:** Seed mejorado y modular (recomendado para nuevos datos)

**Características:**
- Función `seedCourseWithLessons()` reutilizable
- Mejor estructura y documentación
- Tipo-safe con interfaces claras
- Logging detallado
- Relaciones many-to-many incluidas

**Uso:**
```bash
bun run seed:improved
# o
npm run seed:improved
```

**Ejemplo de uso en código:**
```typescript
import { seedCourseWithLessons } from './prisma/improved-seed.ts';

// En tu script:
const result = await seedCourseWithLessons(
  prisma,
  "Nombre del Curso",
  "#FF6B6B",  // colorTheme
  "📐",       // iconUrl
  [
    {
      title: "Lección 1",
      description: "...",
      questions: [
        {
          text: "¿Pregunta?",
          explanation: "Respuesta...",
          difficulty: "BEGINNER",
          type: "MULTIPLE_CHOICE",
          answers: [
            { text: "Opción A", isCorrect: false },
            { text: "Opción B", isCorrect: true },
          ],
        },
      ],
    },
  ]
);
```

---

### 3. **group-seed.ts** (Sin cambios)
**Propósito:** Crea los grupos (sin cambios en estructura)

**Uso:**
```bash
bun run seed:groups
# o
npm run seed:groups
```

---

## 🚀 Flujo Completo de Seeding

```bash
# 1. Crear grupos
bun run seed:groups

# 2. Crear cursos con lecciones y preguntas
bun run seed:main

# O alternativamente, usar el seed mejorado
bun run seed:improved

# 3. Validar la integridad
npm run validate:migration
```

**O todo junto:**
```bash
bun run seed
```

---

## 📊 Estructura de Datos JSON

Los JSON en `/data` deben tener esta estructura:

```json
{
  "course": {
    "name": "Nombre del Curso",
    "colorTheme": "#FF6B6B",
    "iconUrl": "📐"
  },
  "lessons": [
    {
      "title": "Lección 1",
      "description": "Descripción de la lección",
      "questions": [
        {
          "questionText": "¿Cuál es...?",
          "explanationText": "La respuesta es...",
          "difficulty": "BEGINNER",
          "type": "MULTIPLE_CHOICE",
          "from": "Fuente (opcional)",
          "answers": [
            {
              "answerText": "Opción A",
              "isCorrect": false
            },
            {
              "answerText": "Opción B",
              "isCorrect": true
            }
          ]
        }
      ]
    }
  ]
}
```

---

## ✅ Validaciones Post-Seed

Después de ejecutar seeds, validar:

```bash
npm run validate:migration
```

**Verifica:**
- ✅ Todas las preguntas tienen `courseId`
- ✅ No hay duplicados en `lesson_questions`
- ✅ Integridad referencial completa
- ✅ Relaciones many-to-many válidas

---

## 🔍 Debugging Seeds

### Ver logs detallados:
```typescript
// En main-seed.ts o improved-seed.ts
console.log(`✅ Pregunta creada: ${question.id}`);
```

### Verificar datos en BD:
```sql
-- Ver cursos
SELECT * FROM courses;

-- Ver lecciones
SELECT * FROM lessons;

-- Ver preguntas por curso
SELECT q.id, q."questionText", c.name
FROM questions q
JOIN courses c ON q."courseId" = c.id;

-- Ver relaciones many-to-many
SELECT * FROM lesson_questions;
```

### Limpiar BD antes de reseed:
```bash
# Usar Prisma reset (OJO: elimina TODO)
npx prisma db push --skip-generate
npx prisma migrate dev --name reset

# Luego correr seed
bun run seed
```

---

## 📚 Tabla Comparativa: Antes vs Después

| Aspecto | ANTES | AHORA |
|---------|-------|-------|
| Pregunta → Curso | Indirecto (vía Lección) | Directo (`courseId`) |
| Pregunta → Lección | Directo (`lessonId`) | Many-to-many |
| Lección → Curso | Directo (`courseId`) | Independiente |
| Reutilización de Preguntas | ❌ No | ✅ Sí (múltiples lecciones) |
| Estructura de JSON | Lesson → Questions | Lesson ↔ Questions |

---

## 🎯 Checklist para Nuevos Datos

- [ ] JSON válido con estructura correcta
- [ ] Preguntas en formato correcto
- [ ] Respuestas tienen `isCorrect: true/false`
- [ ] Difficulty válido: BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL
- [ ] Type válido: MULTIPLE_CHOICE, DRAG_AND_DROP
- [ ] Archivo en `/data` con prefijo `seed-`
- [ ] Correr `seed:main` para cargar
- [ ] Validar con `validate:migration`

---

## 🚀 Próximos Pasos

1. ✅ Ejecutar `npm run seed` para llenar BD
2. ✅ Ejecutar `npm run validate:migration` para validar
3. ✅ Comenzar a usar la app con datos

---

**Última actualización:** 18 de Abril, 2026  
**Status:** ✅ Completado y testeado

