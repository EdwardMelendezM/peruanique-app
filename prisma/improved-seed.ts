import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

/**
 * Script de seeding mejorado para la nueva estructura many-to-many
 * Estructura: Curso → Preguntas ← Lección (independent)
 */

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
}

/**
 * Crea un curso con lecciones y preguntas
 * Maneja la relación many-to-many correctamente
 */
async function seedCourseWithLessons(
  prisma: PrismaClient,
  courseName: string,
  colorTheme: string,
  iconUrl: string,
  lessonsData: Array<{
    title: string;
    description: string;
    questions: Array<{
      text: string;
      explanation: string;
      difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
      type: "MULTIPLE_CHOICE" | "DRAG_AND_DROP";
      from?: string;
      answers: Array<{ text: string; isCorrect: boolean }>;
    }>;
  }>
) {
  console.log(`\n📚 Creando curso: ${courseName}`);

  // 1. Crear curso
  const course = await prisma.course.create({
    data: {
      name: courseName,
      colorTheme,
      iconUrl,
    },
  });
  console.log(`   ✅ Curso creado (${course.id})`);

  // 2. Crear lecciones independientes
  const lessons = await Promise.all(
    lessonsData.map((lessonData) =>
      prisma.lesson.create({
        data: {
          title: lessonData.title,
          description: lessonData.description,
          lessonType: "GENERIC",
        },
      })
    )
  );
  console.log(`   ✅ ${lessons.length} lecciones creadas`);

  // 3. Crear preguntas Y respuestas
  let totalQuestions = 0;
  let totalAnswers = 0;

  for (let lessonIndex = 0; lessonIndex < lessonsData.length; lessonIndex++) {
    const lessonData = lessonsData[lessonIndex];
    const lesson = lessons[lessonIndex];

    for (
      let questionIndex = 0;
      questionIndex < lessonData.questions.length;
      questionIndex++
    ) {
      const questionData = lessonData.questions[questionIndex];

      // Crear pregunta con courseId directo
      const question = await prisma.question.create({
        data: {
          questionText: questionData.text,
          explanationText: questionData.explanation,
          difficulty: questionData.difficulty,
          type: questionData.type,
          from: questionData.from,
          courseId: course.id, // ✅ Relación directa con curso
        },
      });

      totalQuestions++;

      // Crear respuestas
      const answers = await Promise.all(
        questionData.answers.map((answerData) =>
          prisma.answer.create({
            data: {
              answerText: answerData.text,
              isCorrect: answerData.isCorrect,
              questionId: question.id,
            },
          })
        )
      );

      totalAnswers += answers.length;

      // Crear relación many-to-many: lección ↔ pregunta
      await prisma.lessonQuestion.create({
        data: {
          lessonId: lesson.id,
          questionId: question.id,
          orderIndex: questionIndex,
        },
      });
    }
  }

  console.log(
    `   ✅ ${totalQuestions} preguntas y ${totalAnswers} respuestas creadas`
  );
  console.log(
    `   ✅ Relaciones many-to-many creadas entre lecciones y preguntas`
  );

  return { course, lessons, totalQuestions, totalAnswers };
}

/**
 * Seed principal: crea datos de prueba para todas las categorías
 */
export async function runImprovedSeed() {
  const prisma = createPrismaClient();

  try {
    console.log("🌱 Iniciando seeding mejorado con nueva estructura...\n");

    // Ejemplo: Crear un curso de prueba simple
    const result = await seedCourseWithLessons(
      prisma,
      "Matemática Básica",
      "#FF6B6B",
      "📐",
      [
        {
          title: "Algebra Fundamentals",
          description: "Conceptos básicos de álgebra",
          questions: [
            {
              text: "¿Cuál es la solución de x + 2 = 5?",
              explanation: "Restamos 2 de ambos lados: x = 5 - 2 = 3",
              difficulty: "BEGINNER",
              type: "MULTIPLE_CHOICE",
              answers: [
                { text: "x = 2", isCorrect: false },
                { text: "x = 3", isCorrect: true },
                { text: "x = 7", isCorrect: false },
              ],
            },
          ],
        },
        {
          title: "Geometry Basics",
          description: "Introducción a la geometría",
          questions: [
            {
              text: "¿Cuántos ángulos tiene un triángulo?",
              explanation: "Todo triángulo tiene exactamente 3 ángulos",
              difficulty: "BEGINNER",
              type: "MULTIPLE_CHOICE",
              answers: [
                { text: "2 ángulos", isCorrect: false },
                { text: "3 ángulos", isCorrect: true },
                { text: "4 ángulos", isCorrect: false },
              ],
            },
          ],
        },
      ]
    );

    console.log("\n📊 Resumen del seed:");
    console.log(`   Curso: ${result.course.name}`);
    console.log(`   Lecciones: ${result.lessons.length}`);
    console.log(`   Preguntas: ${result.totalQuestions}`);
    console.log(`   Respuestas: ${result.totalAnswers}`);
    console.log("\n✅ Seeding mejorado completado exitosamente!");
  } catch (error) {
    console.error("❌ Error durante seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution = fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  runImprovedSeed().catch((error) => {
    console.error("[SEED_ERROR]", error);
    process.exit(1);
  });
}

export default runImprovedSeed;

