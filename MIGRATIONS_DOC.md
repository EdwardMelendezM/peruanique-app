# Migrations & Seeds

## Migrations

### New migration
- Run
```shell
bun prisma migrate dev --name <migration_name>
```

### For production (just in the db)
- Run
```shell
bun prisma migrate deploy
```

---

## 🌱 Seeds

### 📋 Available Seeds

1. **seed:groups** - Crea los grupos de usuarios
   ```bash
   bun run seed:groups
   ```

2. **seed:main** - Carga cursos desde JSONs en `/data`
   ```bash
   bun run seed:main
   ```

3. **seed:improved** - Seed mejorado (recomendado para nuevos datos)
   ```bash
   bun run seed:improved
   ```

### 🚀 Complete Seed Flow
```bash
# Run all seeds
bun run seed

# Or individually
bun run seed:groups && bun run seed:main
```

### ✅ Validate Migration
```bash
npm run validate:migration
```

### 📚 Estructura Nueva (Many-to-Many)

**Cambio importante:** Las lecciones ahora son independientes
- Cursos contienen **Preguntas** directamente (con `courseId`)
- Lecciones agrupan preguntas vía **relación many-to-many**
- Una pregunta puede estar en múltiples lecciones

**Ver:** `docs/SEEDS-GUIDE.md` para detalles completos

### 🔄 Seed JSON Structure

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
      "description": "Descripción",
      "questions": [
        {
          "questionText": "¿Pregunta?",
          "explanationText": "Explicación",
          "difficulty": "BEGINNER",
          "type": "MULTIPLE_CHOICE",
          "answers": [
            { "answerText": "Opción", "isCorrect": true }
          ]
        }
      ]
    }
  ]
}
```

---

**Last Updated:** 18 de Abril, 2026

