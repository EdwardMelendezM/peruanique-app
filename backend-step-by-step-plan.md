# Mobile Client Endpoint Contract for FIJA
## Paso 1: Alcance
Este documento define **solo** los endpoints que la app mobile (Android/iOS) necesita consumir.
No incluye arquitectura interna del backend, base de datos, jobs, CI/CD ni server actions internas.
## Paso 2: Objetivo funcional
La app mobile debe poder:
1. Autenticarse y mantener sesión activa.
2. Completar onboarding y guardar perfil.
3. Cargar home con roadmap, progreso y métricas.
4. Resolver lecciones y registrar respuestas.
5. Pedir explicación IA cuando falle una respuesta.
6. Ver ranking.
7. Ver estadísticas del perfil.
## Paso 3: Reglas del contrato
- **Base path**: `/v1`
- **Auth**: los endpoints privados requieren sesión válida.
- **Errores**: siempre devolver `{ success: false, error: { code, message } }`.
- **Éxito**: usar `{ success: true, data: ... }`.
- **Fechas**: ISO-8601 en UTC.
- **IDs**: strings UUID.
- **Paginación**: `skip`, `take`, `hasMore`, `totalCount` cuando aplique.
- **Campos opcionales**: documentarlos explícitamente como `?`.
## Paso 4: Contratos de endpoints requeridos por el cliente mobile

### Formato estándar por endpoint

Cada endpoint debe documentarse con esta estructura:

- **Método + ruta**
- **Propósito**
- **Auth requerida**: sí / no
- **Request**: campos obligatorios y opcionales
- **Response**: campos que consume la app mobile
- **Errores esperados**: cuando aplique

### 4.1 Auth y sesión

#### `POST /v1/auth/register`
**Propósito:** registrar al usuario y devolver su sesión inicial para entrar a la app móvil.

**Auth requerida:** no

**Request**
- `email`
- `password`
- `username`
- `fullName`

**Response**
- `success`
- `data.user`
- `data.session`

**Response mínimo esperado**
- `data.user.id`
- `data.user.email`
- `data.user.username`
- `data.user.fullName`
- `data.user.groupId?`
- `data.session.token`
- `data.session.expiresAt`

**Errores esperados**
- `VALIDATION_ERROR`
- `SERVER_ERROR`

#### `POST /v1/auth/login`
**Propósito:** iniciar sesión con credenciales válidas y recuperar la sesión activa.

**Auth requerida:** no

**Request**
- `email`
- `password`

**Response**
- `success`
- `data.user`
- `data.session`

**Response mínimo esperado**
- `data.user.id`
- `data.user.email`
- `data.user.username`
- `data.user.fullName`
- `data.user.groupId?`
- `data.session.token`
- `data.session.expiresAt`

**Errores esperados**
- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `SERVER_ERROR`

#### `POST /v1/auth/logout`
**Propósito:** cerrar la sesión actual.

**Auth requerida:** sí

**Response**
- `success`
- `data.loggedOut = true`

#### `GET /v1/me`
**Propósito:** obtener la sesión activa y el perfil mínimo del usuario autenticado.

**Auth requerida:** sí

**Response**
- `success`
- `data.id`
- `data.email`
- `data.username`
- `data.fullName`
- `data.groupId`
- `data.birthDate`
- `data.isActive`

**Response mínimo esperado**
- `data.id`
- `data.email`
- `data.username`
- `data.fullName`
- `data.groupId`
- `data.birthDate`
- `data.isActive`

**Errores esperados**
- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

**Ejemplo de respuesta**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "username": "alex23",
    "fullName": "Alex Perez",
    "groupId": "group-a",
    "birthDate": "2007-04-12",
    "isActive": true
  }
}
```

#### `PATCH /v1/me`
**Propósito:** actualizar el perfil del usuario autenticado.

**Auth requerida:** sí

**Request**
- `username?`
- `fullName?`
- `birthDate?`
- `groupId?`

**Response**
- `success`
- `data.updated = true`
- `data.user`

### 4.2 Onboarding

#### `GET /v1/onboarding/groups`
**Propósito:** listar los grupos disponibles para la selección inicial.

**Auth requerida:** no

**Response**
- `success`
- `data[]`
  - `id`
  - `name`
  - `description?`

#### `POST /v1/onboarding/complete`
**Propósito:** finalizar onboarding y guardar grupo/perfil inicial.

**Auth requerida:** sí

**Request**
- `groupId`
- `username`
- `birthDate`

**Response**
- `success`
- `data.completed = true`
- `data.user`

### 4.3 Home / Roadmap

#### `GET /v1/roadmap?groupId=...`
**Propósito:** devolver el roadmap del grupo con el estado de avance del usuario.

**Auth requerida:** sí

**Response**
- `success`
- `data.group`
  - `id`
  - `name`
  - `description?`
- `data.summary`
  - `points` (totalXp del usuario)
  - `coins` (fromRewardEvents)
  - `streakDays`
  - `completedLessons` (COUNT de UserProgress con status COMPLETED)
- `data.nodes[]`
  - `id` (RoadmapNode.id)
  - `lessonId`
  - `lessonTitle`
  - `status` (`LOCKED | IN_PROGRESS | COMPLETED`)
  - `orderIndex`
  - `progressPercent` (scoreObtained / max_score)

#### `GET /v1/home`
**Propósito:** endpoint de conveniencia para la pantalla principal.

**Auth requerida:** sí

**Response**
- `success`
- `data.roadmap`
- `data.profileSummary`
- `data.nextLesson`
- `data.recentActivity[]`

### 4.4 Lecciones y preguntas

#### `GET /v1/lessons/:lessonId`
**Propósito:** devolver la información de una lección.

**Auth requerida:** sí

**Response**
- `success`
- `data.id`
- `data.title`
- `data.description?`
- `data.courseId`
- `data.courseName`
- `data.questionsCount`
- `data.userProgress` (status, scoreObtained, starsEarned)

#### `GET /v1/lessons/:lessonId/question`
**Propósito:** entregar la siguiente pregunta disponible para esa lección.

**Auth requerida:** sí

**Response**
- `success`
- `data.questionId`
- `data.prompt` (questionText)
- `data.difficulty` (BEGINNER | INTERMEDIATE | ADVANCED | PROFESSIONAL)
- `data.options[]`
  - `optionId` (Answer.id)
  - `text` (answerText)
- `data.from?` (source, e.g., "UNSAAC ORD 2023-I")

#### `POST /v1/lessons/:lessonId/answer`
**Propósito:** registrar la respuesta del usuario.

**Auth requerida:** sí

**Request**
- `questionId`
- `selectedOptionId` (Answer.id)
- `timeSpentSeconds`

**Response**
- `success`
- `data.attemptId` (LessonAttempt.id)
- `data.isCorrect`
- `data.correctOptionId` (correct Answer.id)
- `data.xpDelta` (reward calculation based on isCorrect & difficulty)
- `data.showInsight` (boolean to show explanation)
- `data.explanation?` (explanationText from Question if isCorrect=false)

#### `GET /v1/lessons/:lessonId/progress`
**Propósito:** devolver el progreso del usuario para la lección.

**Auth requerida:** sí

**Response**
- `success`
- `data.status` (LOCKED | IN_PROGRESS | COMPLETED)
- `data.score` (scoreObtained)
- `data.starsEarned` (0-3)
- `data.completedQuestions` (COUNT of correct LessonAttempt)
- `data.totalQuestions` (COUNT of Question where lessonId=:lessonId)

### 4.5 Insight IA

#### `POST /v1/insight/generate`
**Propósito:** generar la explicación cuando el usuario falla una pregunta.

**Auth requerida:** sí

**Request**
- `attemptId` (LessonAttempt.id)

**Response**
- `success`
- `data.provider` (e.g., "openai", "anthropic")
- `data.model` (e.g., "gpt-4", "claude-3")
- `data.content[]`
  - `title` (section title)
  - `body` (explanation text)
  - `formulaLatex?` (LaTeX formula if applicable)
  - `highlight?` (highlighted concept)

**Fallback obligatorio**
Si la IA falla, devolver `data.fallback: true` y `data.explanation` (explanationText de Question):
```json
{
  "success": true,
  "data": {
    "fallback": true,
    "explanation": "Text from Question.explanationText"
  }
}
```

### 4.6 Ranking

#### `GET /v1/ranking?groupId=...&period=daily`
**Propósito:** obtener ranking por grupo o global.

**Auth requerida:** sí

**Query Parameters**
- `groupId?` (UUID of group, optional for global ranking)
- `period?` (daily | weekly | all, default: daily)

**Response**
- `success`
- `data.period` (daily | weekly | all)
- `data.groupId?` (if filtered by group)
- `data.items[]`
  - `position` (1-based rank)
  - `userId`
  - `username` (User.name)
  - `points` (User.totalXp)
  - `streakDays` (User.streakDays)

### 4.7 Perfil

#### `GET /v1/profile/stats`
**Propósito:** obtener estadísticas principales del usuario.

**Auth requerida:** sí

**Response**
- `success`
- `data.completedLessons` (COUNT of UserProgress where status=COMPLETED)
- `data.points` (User.totalXp)
- `data.coins` (SUM of RewardEvent.pointsDelta for this user)
- `data.streakDays` (User.streakDays)
- `data.level` (calculated from totalXp, e.g., floor(totalXp / 1000) + 1)

#### `GET /v1/profile/activity`
**Propósito:** obtener la actividad reciente del usuario.

**Auth requerida:** sí

**Response**
- `success`
- `data.items[]`
  - `type` (lesson_completed | streak_reached | level_up | daily_goal)
  - `title` (e.g., "Completaste: Distribuciones Numéricas")
  - `subtitle?` (e.g., "3 estrellas ganadas")
  - `createdAt` (ISO-8601)

## Paso 5: Endpoints opcionales

Estos endpoints no son obligatorios para el primer cliente mobile, pero pueden mejorar la experiencia:

- `GET /v1/courses`
- `GET /v1/courses/:courseId/lessons`
- `GET /v1/rewards`
- `GET /v1/settings`

## Paso 6: Orden recomendado de integración en mobile

1. `POST /v1/auth/register`
2. `POST /v1/auth/login`
3. `GET /v1/me`
4. `POST /v1/onboarding/complete`
5. `GET /v1/home`
6. `GET /v1/roadmap`
7. `GET /v1/lessons/:lessonId/question`
8. `POST /v1/lessons/:lessonId/answer`
9. `POST /v1/insight/generate`
10. `GET /v1/ranking`
11. `GET /v1/profile/stats`

## Paso 7: Contrato de errores

Ejemplo:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must sign in to continue"
  }
}
```

Errores mínimos esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `SERVER_ERROR`

## Paso 8: Fuera de alcance

- Diseño de base de datos.
- Jobs o colas.
- Admin dashboard.
- Migraciones.
- Server Actions internas.
- Seed data.

## Paso 9: Definition of Done para el cliente mobile

- [ ] El login y registro funcionan con sesión real.
- [ ] El onboarding guarda grupo y perfil.
- [ ] Home carga roadmap y métricas reales.
- [ ] Lesson consume preguntas y registra respuestas.
- [ ] Insight IA devuelve explicación o fallback.
- [ ] Ranking y perfil muestran datos del backend.
- [ ] Los errores están estandarizados.
- [ ] Todos los endpoints están versionados con `/v1`.
