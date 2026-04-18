# 📋 Plan de Actualización de Endpoints API v1

## 🎯 Objetivo

Actualizar todos los endpoints de `app/api/v1/` para que funcionen correctamente con la nueva estructura **many-to-many** de lecciones y preguntas.

---

## 📊 Estado Actual de Endpoints

### ✅ **ACTUALIZADOS** (Ya tienen LessonQuestion)
- [x] `POST /v1/lessons/:lessonId/answer` - Validación de relación many-to-many
- [x] `GET /v1/lessons/:lessonId/question` - Obtiene preguntas via LessonQuestion

### ⚠️ **PARCIALMENTE ACTUALIZADOS** (Necesitan ajustes)
- [ ] `GET /v1/home` - Usa lecciones pero necesita verificar queries
- [ ] `GET /v1/roadmap` - Roadmap nodes sin filtro por curso (OK)

### ❌ **POR ACTUALIZAR** (Aún con estructura vieja)
- [ ] `GET /v1/lessons/:lessonId` - Aún busca `courseId` en Lesson
- [ ] `GET /v1/lessons/:lessonId/progress` - Puede necesitar actualización
- [ ] `GET /v1/profile/*` - Revisar queries
- [ ] `GET /v1/ranking` - Revisar si usa lecciones/cursos

### ℹ️ **SIN CAMBIOS** (No afectados)
- [x] `POST /v1/auth/login`
- [x] `POST /v1/auth/logout`
- [x] `POST /v1/auth/register`
- [x] `GET /v1/me`
- [x] `GET /v1/onboarding/groups`
- [x] `POST /v1/onboarding/complete`
- [x] `POST /v1/insight/generate`

---

## 🔧 Cambios Necesarios Por Endpoint

### 1. **GET /v1/lessons/:lessonId** ❌
**Ubicación:** `app/api/v1/lessons/[lessonId]/route.ts`

**Problema:**
```typescript
// ❌ Busca courseId en Lesson
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: {
    courseId: true,  // ❌ Ya no existe
    course: { ... }  // ❌ Ya no existe
  }
});
```

**Solución:**
```typescript
// ✅ Obtener lección sin course reference
// ✅ Obtener preguntas via LessonQuestion
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: {
    id: true,
    title: true,
    description: true,
    lessonType: true,
    questions: {
      select: {
        question: {
          select: {
            id: true,
            questionText: true,
            course: { select: { name: true } }
          }
        }
      },
      orderBy: { orderIndex: "asc" }
    }
  }
});
```

**Impacto:** ⭐⭐⭐ (Mobile app puede depender)

---

### 2. **GET /v1/lessons/:lessonId/progress** ⚠️
**Ubicación:** `app/api/v1/lessons/[lessonId]/progress/route.ts`

**Revisar:**
- Que siga usando `UserProgress` correctamente
- Que valide la relación `LessonQuestion`

**Cambios esperados:** Menores o ninguno

---

### 3. **GET /v1/home** ⚠️
**Ubicación:** `app/api/v1/home/route.ts`

**Ya actualizado:** ✅ Usa `RoadmapNode` y `Lesson` correctamente

**Verificar:**
- [ ] Que obtenga roadmap nodes del usuario
- [ ] Que calcule progreso correctamente
- [ ] Que retorne siguiente lección correcta

---

### 4. **GET /v1/roadmap** ✅
**Ubicación:** `app/api/v1/roadmap/route.ts`

**Status:** Ya sin filtro por curso ✅

---

### 5. **GET /v1/profile/stats** ℹ️
**Ubicación:** `app/api/v1/profile/stats/route.ts`

**Revisar:**
- [ ] Si usa lecciones o preguntas
- [ ] Si calcula estadísticas correctamente

---

### 6. **GET /v1/ranking** ℹ️
**Ubicación:** `app/api/v1/ranking/route.ts`

**Revisar:**
- [ ] Si filtra por grupo/curso
- [ ] Si usa lecciones completadas

---

## 📋 Checklist de Actualización

### Fase 1: Auditoría (1h)
- [ ] Revisar cada endpoint `/v1/lessons/*`
- [ ] Identificar queries que usan `courseId` en Lesson
- [ ] Documentar cambios necesarios

### Fase 2: Actualización (2h)
- [ ] Actualizar `GET /v1/lessons/:lessonId`
- [ ] Actualizar `GET /v1/lessons/:lessonId/progress`
- [ ] Revisar y ajustar queries si es necesario
- [ ] Actualizar queries de `course`

### Fase 3: Testing (1h)
- [ ] Testear cada endpoint
- [ ] Validar respuestas JSON
- [ ] Verificar relaciones many-to-many
- [ ] Revisar errores

### Fase 4: Documentación (30m)
- [ ] Actualizar comentarios JSDoc
- [ ] Documentar cambios en endpoints
- [ ] Crear guide de endpoints actualizado

---

## 🔄 Cambios de Queries

### Patrón VIEJO
```typescript
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  include: {
    course: { select: { name: true } },  // ❌ No existe
    questions: {  // ❌ Estructura vieja
      select: { ... }
    }
  }
});
```

### Patrón NUEVO
```typescript
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: {
    id: true,
    title: true,
    lessonType: true,
    questions: {  // ✅ Many-to-many
      select: {
        questionId: true,
        orderIndex: true,
        question: {
          select: {
            id: true,
            questionText: true,
            difficulty: true,
            type: true,
            course: {
              select: { name: true, id: true }
            },
            answers: {
              select: { id: true, answerText: true, isCorrect: true }
            }
          }
        }
      },
      orderBy: { orderIndex: "asc" }
    }
  }
});
```

---

## 📊 Matriz de Impacto

| Endpoint | Impacto | Prioridad | Esfuerzo | Status |
|----------|---------|-----------|----------|--------|
| `GET /v1/lessons/:lessonId` | Alto | 🔴 Alta | 30m | ❌ Por hacer |
| `GET /v1/lessons/:lessonId/progress` | Medio | 🟡 Media | 15m | ⚠️ Revisar |
| `GET /v1/home` | Alto | 🟢 Baja | 0m | ✅ OK |
| `GET /v1/roadmap` | Alto | 🟢 Baja | 0m | ✅ OK |
| `GET /v1/profile/stats` | Bajo | 🟢 Baja | 15m | ℹ️ Revisar |
| `GET /v1/ranking` | Bajo | 🟢 Baja | 15m | ℹ️ Revisar |
| Auth endpoints | Ninguno | 🟢 Baja | 0m | ✅ OK |

---

## 🚀 Plan de Ejecución

### **Paso 1: Auditoría Rápida** (15 min)
```bash
# Buscar referencias a "courseId" en lecciones
grep -r "courseId" app/api/v1 | grep -i lesson

# Buscar referencias a "lessonId" en preguntas
grep -r "lessonId" app/api/v1 | grep -i question
```

### **Paso 2: Actualizar GET /v1/lessons/:lessonId** (30 min)
- Remover búsqueda de `courseId` en Lesson
- Cambiar a query via `LessonQuestion`
- Testear respuesta

### **Paso 3: Revisar Otros Endpoints** (30 min)
- Verificar `GET /v1/lessons/:lessonId/progress`
- Verificar `GET /v1/profile/*`
- Verificar `GET /v1/ranking`

### **Paso 4: Testing Completo** (30 min)
- Hacer requests a todos los endpoints
- Validar respuestas JSON
- Verificar manejo de errores

### **Paso 5: Documentación** (30 min)
- Actualizar comentarios en código
- Crear documento de referencia
- Actualizar OpenAPI/Swagger si existe

---

## 📝 Ejemplo: GET /v1/lessons/:lessonId

### ANTES (Incorrecto)
```typescript
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: {
    id: true,
    title: true,
    courseId: true,  // ❌ ERROR
    course: {  // ❌ ERROR
      select: { id: true, name: true }
    },
    questions: {  // ❌ Array de Question, no LessonQuestion
      select: {
        id: true,
        questionText: true
      }
    }
  }
});
```

### DESPUÉS (Correcto)
```typescript
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: {
    id: true,
    title: true,
    description: true,
    lessonType: true,
    questions: {  // ✅ Array de LessonQuestion
      select: {
        id: true,
        orderIndex: true,
        question: {
          select: {
            id: true,
            questionText: true,
            explanationText: true,
            difficulty: true,
            type: true,
            from: true,
            course: {  // ✅ Accesible via question
              select: { id: true, name: true }
            },
            answers: {
              select: { id: true, answerText: true, isCorrect: true }
            }
          }
        }
      },
      orderBy: { orderIndex: "asc" }
    }
  }
});

// Reformatear respuesta
return jsonSuccess({
  id: lesson.id,
  title: lesson.title,
  description: lesson.description,
  type: lesson.lessonType,
  courseName: lesson.questions[0]?.question.course.name,  // ✅ Desde primera pregunta
  questions: lesson.questions.map(lq => ({
    id: lq.question.id,
    text: lq.question.questionText,
    explanation: lq.question.explanationText,
    difficulty: lq.question.difficulty,
    type: lq.question.type,
    answers: lq.question.answers
  }))
}, 200);
```

---

## 🎯 Próximos Pasos

1. ✅ Leer este plan
2. ⏭️ Ejecutar auditoría (Paso 1)
3. ⏭️ Actualizar endpoints (Pasos 2-3)
4. ⏭️ Testing completo (Paso 4)
5. ⏭️ Documentación (Paso 5)

---

**Tiempo estimado total:** ~2-3 horas
**Complejidad:** Media
**Riesgo:** Bajo (cambios internos, API signature igual)

---

**Creado:** 18 de Abril, 2026
**Status:** 📋 Listo para comenzar

