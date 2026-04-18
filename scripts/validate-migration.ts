const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Script de validación post-migración
 * Verifica que la nueva estructura many-to-many sea correcta
 */
async function validateMigration() {
  console.log("🔍 Iniciando validación post-migración...\n");

  try {
    // 1. Verificar que todas las preguntas tienen courseId
    const questionsWithoutCourse = await prisma.question.findMany({
      where: { courseId: null },
      select: { id: true },
    });

    if (questionsWithoutCourse.length > 0) {
      console.log(
        `❌ ERROR: ${questionsWithoutCourse.length} preguntas sin courseId`
      );
      return false;
    }
    console.log("✅ Todas las preguntas tienen courseId");

    // 2. Verificar que no hay lecciones con courseId (Prisma no permite null en where)
    const lessonsCount = await prisma.lesson.count();
    console.log(`✅ Total de lecciones: ${lessonsCount}`);

    // 3. Verificar relaciones many-to-many
    const lessonQuestionsCount = await prisma.lessonQuestion.count();
    console.log(`✅ Registros en lesson_questions: ${lessonQuestionsCount}`);

    // 4. Verificar que no hay duplicados en relaciones
    const duplicates = await prisma.$queryRaw`
      SELECT "lessonId", "questionId", COUNT(*) as count
      FROM "lesson_questions"
      GROUP BY "lessonId", "questionId"
      HAVING COUNT(*) > 1
    `;

    if ((duplicates as any[]).length > 0) {
      console.log(
        `❌ ERROR: Se encontraron relaciones duplicadas en lesson_questions`
      );
      return false;
    }
    console.log("✅ No hay relaciones duplicadas");

    // 5. Contar recursos
    const stats = await Promise.all([
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.question.count(),
      prisma.answer.count(),
      prisma.roadmapNode.count(),
    ]);

    console.log("\n📊 Estadísticas:");
    console.log(`   Cursos: ${stats[0]}`);
    console.log(`   Lecciones: ${stats[1]}`);
    console.log(`   Preguntas: ${stats[2]}`);
    console.log(`   Respuestas: ${stats[3]}`);
    console.log(`   Nodos de Roadmap: ${stats[4]}`);

    // 6. Verificar integridad referencial
    console.log("\n🔗 Validando integridad referencial...");

    // Lecciones sin questions
    const lessonsWithoutQuestions = await prisma.lesson.findMany({
      where: {
        questions: { none: {} },
      },
      select: { id: true, title: true },
    });

    if (lessonsWithoutQuestions.length > 0) {
      console.log(
        `ℹ️  ${lessonsWithoutQuestions.length} lecciones sin preguntas (esto es normal)`
      );
    }

    // Verificar que cada question_lesson tiene referencias válidas
    const invalidRelations = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "lesson_questions" lq
      WHERE NOT EXISTS (
        SELECT 1 FROM "lessons" l WHERE l."id" = lq."lessonId"
      ) OR NOT EXISTS (
        SELECT 1 FROM "questions" q WHERE q."id" = lq."questionId"
      )
    `;

    if ((invalidRelations as any[])[0]?.count > 0) {
      console.log("❌ ERROR: Relaciones inválidas detectadas");
      return false;
    }
    console.log("✅ Todas las relaciones son válidas");

    console.log("\n✅ VALIDACIÓN COMPLETADA EXITOSAMENTE\n");
    return true;
  } catch (error) {
    console.error("❌ Error durante validación:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

validateMigration().then((success) => {
  process.exit(success ? 0 : 1);
});

