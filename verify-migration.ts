import { prisma } from "./lib/prisma";

async function main() {
  try {
    const courses = await prisma.course.count();
    const lessons = await prisma.lesson.count();
    const questions = await prisma.question.count();
    const lessonQuestions = await prisma.lessonQuestion.count();
    const answers = await prisma.answer.count();

    console.log("📊 Datos migrados:");
    console.log("Cursos:", courses);
    console.log("Lecciones:", lessons);
    console.log("Preguntas:", questions);
    console.log("LessonQuestions:", lessonQuestions);
    console.log("Respuestas:", answers);

    // Verificar una pregunta tiene courseId
    const question = await prisma.question.findFirst();
    console.log("\n✅ Pregunta con courseId:", !!question?.courseId);

    // Verificar una lección tiene lessonType
    const lesson = await prisma.lesson.findFirst();
    console.log("✅ Lección con lessonType:", lesson?.lessonType);

    // Verificar lesson_questions
    const lq = await prisma.lessonQuestion.findFirst();
    console.log("✅ LessonQuestion existe:", !!lq);

    // Verificar relaciones
    if (lq) {
      const lessonWithQuestions = await prisma.lesson.findUnique({
        where: { id: lq.lessonId },
        include: { questions: true },
      });
      console.log(
        "✅ Lección con preguntas include:",
        lessonWithQuestions?.questions.length ?? 0
      );
    }

    console.log("\n🎉 Migración exitosa!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

