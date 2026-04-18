# 📋 Plan de Refactorización: Lecciones y Preguntas

## 🎯 Objetivo

Cambiar la estructura de datos para permitir que:
- **Curso** → Contiene muchas **Preguntas** directamente (no lecciones)
- **Lección** → Es una colección flexible de **Preguntas** de múltiples cursos
- Las lecciones pueden tener distintos tipos, nombres y propósitos

---

## 📊 Estructura Actual (INCORRECTA)

```
Curso → Lección → Pregunta → Respuesta
```

**Problema**: Una pregunta solo puede estar en una lección, y esa lección solo en un curso.

---

## 📊 Estructura Nueva (CORRECTA)

```
Curso → Preguntas ← Lección (colección flexible)
                 ↓
            Respuestas
```

**Beneficio**: Una pregunta puede estar en múltiples lecciones. Las lecciones agrupan preguntas libremente.

---

## 🔄 Cambios en el Schema Prisma

### 1. **Eliminar relación Curso → Lección**

**ANTES:**
```prisma
model Course {
  lessons Lesson[]  // ❌ Acoplamiento
}

model Lesson {
  courseId String
  course   Course @relation(...)  // ❌ Obligatoria
  questions Question[]
}
```

**DESPUÉS:**
```prisma
model Course {
  id    String @id @default(uuid())
  name  String
  
  questions Question[]  // ✅ NUEVA relación directa
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Lesson {
  id          String @id @default(uuid())
  title       String
  description String? @db.Text
  lessonType  String @default("GENERIC")  // GENERIC, REVIEW, PRACTICE, etc.
  
  // ✅ Relación many-to-many con preguntas
  questions LessonQuestion[]
  
  roadmapNodes RoadmapNode[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ✅ NUEVA tabla intermedia
model LessonQuestion {
  id          String @id @default(uuid())
  
  lessonId    String
  lesson      Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  orderIndex  Int  // Orden dentro de la lección
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([lessonId, questionId])  // Evita duplicados
  @@index([lessonId])
  @@map("lesson_questions")
}

model Question {
  id       String @id @default(uuid())
  
  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  questionText    String       @db.Text
  explanationText String?      @db.Text
  difficulty      Difficulty   @default(BEGINNER)
  type            QuestionType @default(MULTIPLE_CHOICE)
  from            String?
  
  // ✅ Relación many-to-many con lecciones
  lessons LessonQuestion[]
  
  answers  Answer[]
  attempts LessonAttempt[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([courseId])
  @@map("questions")
}
```

---

## 🔄 Cambios en la Base de Datos

### Migración Prisma

```bash
# 1. Crear la nueva estructura
npx prisma migrate dev --name add_lesson_question_many_to_many

# 2. Migrar datos existentes
# (Script manual para copiar preguntas de lecciones a LessonQuestion)

# 3. Eliminar columna courseId de Lesson
npx prisma migrate dev --name remove_course_id_from_lesson

# 4. Verificar integridad
npx prisma db seed
```

---

## 📁 Cambios en Features

### **1. features/courses/**

#### Cambios necesarios:
- ❌ Remover `/lessons` de los endpoints (las lecciones ya no pertenecen a cursos)
- ✅ Agregar endpoints para gestionar preguntas por curso
- ✅ Endpoints CRUD de `Question`

**Nuevos endpoints:**
```
POST   /admin/courses/{courseId}/questions        → Crear pregunta
GET    /admin/courses/{courseId}/questions        → Listar preguntas
PUT    /admin/courses/{courseId}/questions/{qId}  → Editar pregunta
DELETE /admin/courses/{courseId}/questions/{qId}  → Eliminar pregunta
```

---

### **2. features/lessons/** (NUEVA ESTRUCTURA)

Las lecciones ahora son entidades independientes que pueden agrupar preguntas de múltiples cursos.

#### Nuevos endpoints:
```
GET    /admin/lessons                     → Listar lecciones
POST   /admin/lessons                     → Crear lección
PUT    /admin/lessons/{lessonId}          → Editar lección
DELETE /admin/lessons/{lessonId}          → Eliminar lección

GET    /admin/lessons/{lessonId}/questions              → Listar preguntas en lección
POST   /admin/lessons/{lessonId}/questions/{questionId} → Agregar pregunta a lección
DELETE /admin/lessons/{lessonId}/questions/{questionId} → Remover pregunta de lección
PUT    /admin/lessons/{lessonId}/questions/{questionId}/order → Cambiar orden
```

---

### **3. features/roadmap/**

#### Cambios:
- ✅ Los RoadmapNodes siguen apuntando a Lessons (sin cambios en concepto)
- ✅ Pero ahora las lecciones pueden venir de múltiples cursos
- ✅ El filtro por curso en el modal debe actualizar la lógica

**Actualización del modal RoadmapNodeModal:**
```typescript
// Cambiar de:
// lessonOptions = lessons directamente

// A:
// 1. Obtener TODOS los cursos
const courses = getCourses();

// 2. Al seleccionar un curso, obtener sus preguntas
const questions = getQuestionsByCourse(courseId);

// 3. Crear una lección "temporal" o buscar/crear lección asociada
// O mejor: Mostrar las lecciones disponibles (independientes de cursos)
```

---

## 🛠️ Plan de Implementación Paso a Paso

### **Fase 1: Schema Prisma** ✅ COMPLETADA (1-2 horas)
- [x] Crear `LessonQuestion` tabla intermedia
- [x] Mover `courseId` de `Lesson` a `Question`
- [x] Agregar campos a `Lesson` (lessonType, etc.)
- [x] Ejecutar migración y verificar
- [x] Migración de datos completada sin pérdidas

### **Fase 2: Actualización de Código** ✅ COMPLETADA (2-3 horas)
- [x] Actualizar `lesson-helpers.ts` - getNextQuestion, countCompletedQuestions, getTotalQuestions
- [x] Actualizar `/v1/lessons/:lessonId/answer` - Validación de question en lección
- [x] Actualizar `question-answer-actions.ts` - Queries con nueva estructura
- [x] Actualizar `course-actions.ts` - Cambiar de `lessonsCount` a `questionsCount`
- [x] Actualizar `course-content-queries.ts` - Mostrar preguntas directamente del curso
- [x] Deprecar `course-lesson-queries.ts` - Las lecciones ya no pertenecen a cursos
- [x] Actualizar `roadmap-node-queries.ts` - Remover relación `lesson.course`

### **Fase 3: Admin - Gestión de Lecciones** ✅ COMPLETADA (3-4h)
- [x] Crear CRUD de lecciones (independientes)
  - [x] `features/lessons/schemas/lesson-schemas.ts` - Zod schemas
  - [x] `features/lessons/actions/lesson-actions.ts` - Server actions (create, update, delete, add/remove questions)
  - [x] `features/lessons/actions/lesson-queries.ts` - Query functions
  - [x] `features/lessons/components/lesson-modal.tsx` - Modal para crear/editar
  - [x] `features/lessons/components/lesson-manager.tsx` - Gestor principal
  - [x] `app/(admin)/admin/lessons/page.tsx` - Página admin
- [ ] Crear gestor de preguntas dentro de lecciones
  - [ ] `features/lessons/components/lesson-questions-manager.tsx`
  - [ ] Drag-and-drop para reordenar preguntas (opcional para MVP)

### **Fase 4: Roadmap - Actualizar modal** ✅ COMPLETADA (1-2h)
- [x] Actualizar `RoadmapNodeModal`
  - [x] Remover filtro por curso (las lecciones ya son libres)
  - [x] Mostrar todas las lecciones disponibles
  - [x] Simplificar UI

### **Fase 5: API Mobile** (1-2h) - Próxima
- [ ] Actualizar endpoints de lecciones
  - [x] `GET /v1/lessons/{lessonId}/question` (ya actualizado en Fase 2)
  - [x] `POST /v1/lessons/{lessonId}/answer` (ya actualizado en Fase 2)
  - [ ] Crear `GET /v1/lessons/{lessonId}` si es necesario para mobile

### **Fase 6: Testing & Validation** (1-2h) - Próxima
- [ ] Migrar datos existentes (script)
- [ ] Verificar integridad referencial
- [ ] Probar endpoints
- [ ] Actualizar seeds

---

## 📋 Checklist Detallado

### Schema (Fase 1)
```sql
-- Nueva tabla intermedia
CREATE TABLE lesson_questions (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL,
  question_id UUID NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(lesson_id, question_id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Mover courseId de lessons a questions (ya existe)
-- Eliminar courseId de lessons
ALTER TABLE lessons DROP COLUMN course_id;

-- Agregar lessonType a lessons
ALTER TABLE lessons ADD COLUMN lesson_type VARCHAR DEFAULT 'GENERIC';
```

### Migraciones de datos (Fase 6)
```typescript
// script: prisma/migrate-lessons.ts
async function migrateLessons() {
  // 1. Para cada lección actual
  // 2. Obtener sus preguntas
  // 3. Crear registros en LessonQuestion
  // 4. Mantener el courseId de las preguntas
}
```

---

## 🎨 UI/UX Changes

### Admin: Courses
```
Cursos
├── Curso A (Matemática)
│   ├── Preguntas (NUEVO)
│   │   ├── [+] Crear pregunta
│   │   ├── Pregunta 1
│   │   ├── Pregunta 2
│   │   └── Pregunta 3
│   └── (Sin sección de Lecciones)
└── Curso B (Física)
```

### Admin: Lessons (NUEVA sección)
```
Lecciones
├── [+] Nueva lección
├── Lección 1 (Review - Matemática)
│   ├── Preguntas en esta lección
│   │   ├── Pregunta 1 (de Matemática)
│   │   ├── Pregunta 2 (de Física) ✅ Múltiples cursos
│   │   └── [+] Agregar pregunta
│   └── Editar | Eliminar
└── Lección 2 (Practice - Física)
```

### Admin: Roadmap (actualizado)
```
Roadmap - Grupo A
├── Filtro: [Todos los cursos ▼]  (menos relevante ahora)
├── [+] Nuevo nodo
├── Nodo 1: Lección "Review Matemática"
├── Nodo 2: Lección "Practice Física"
└── Nodo 3: Lección "Mixed Review"
```

---

## 🔗 Relaciones finales

```
Course (1) ──→ (n) Question
              ↓
              (n) LessonQuestion (many-to-many)
              ↑
Lesson (1) ──┘

RoadmapNode (1) ──→ (1) Lesson
```

---

## ⚠️ Consideraciones de Riesgos

| Risk | Mitigation |
|------|-----------|
| Datos duplicados en migración | Script de validación pre/post |
| Queries más complejas | Usar `include` de Prisma correctamente |
| Performance con many-to-many | Agregar índices en `lesson_questions` |
| Cambios en API mobile | Versión compatibilidad `v2` |

---

## 📊 Impacto en endpoints existentes

| Endpoint | Status | Cambio |
|----------|--------|--------|
| `GET /v1/home` | ✅ Sin cambios | Sigue usando lecciones |
| `GET /v1/lessons/:id/question` | ✅ Actualizar | Query debe ser más compleja |
| `POST /v1/lessons/:id/answer` | ✅ Sin cambios | Funciona igual |
| `GET /v1/roadmap?groupId=...` | ⚠️ Actualizar | Modal de selección de lecciones |

---

## 🚀 Next Steps

1. ✅ Leer este plan
2. ✅ Crear migración Prisma (Fase 1)
3. ✅ Implementar actualización de código (Fase 2)
4. ✅ Implementar CRUD de Lesson (Fase 3)
5. ✅ Actualizar roadmap modal (Fase 4)
6. ⏭️ Testing completo (Fase 5 - Opcional)

---

## 📚 Documentos Relacionados

- **REFACTORIZATION-COMPLETE.md** - Resumen detallado de lo completado
- **backend-step-by-step-plan.md** - Plan original de endpoints


