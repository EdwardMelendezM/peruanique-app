import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

// --- Tipos ---
// Validan la estructura del JSON, ignorando ids temporales si existieran.
type SeedAnswer = { answerText: string; isCorrect: boolean };
type SeedQuestion = {
  questionText: string;
  explanationText: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  type: "MULTIPLE_CHOICE" | "DRAG_AND_DROP";
  from?: string;
  answers: SeedAnswer[];
};
type SeedLesson = {
  title: string;
  description: string;
  questions: SeedQuestion[];
};
type SeedData = {
  course: { name: string; colorTheme: string; iconUrl: string };
  lessons: SeedLesson[];
};

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
}

async function seedFile(filePath: string, prisma: PrismaClient) {
  const rawData = await fs.readFile(filePath, "utf-8");
  const data: SeedData = JSON.parse(rawData);

  console.log(`[SEED] Insertando nuevo curso: ${data.course.name}...`);

  // 1. Crear curso
  const createdCourse = await prisma.course.create({
    data: {
      name: data.course.name,
      colorTheme: data.course.colorTheme,
      iconUrl: data.course.iconUrl,
    },
  });
  console.log(`  ✅ Curso creado: ${createdCourse.id}`);

  // 2. Crear lecciones independientes (sin courseId)
  const lessonMap = new Map<string, string>();

  for (const lesson of data.lessons) {
    const createdLesson = await prisma.lesson.create({
      data: {
        title: lesson.title,
        description: lesson.description,
        lessonType: "GENERIC", // Tipo por defecto
      },
    });
    lessonMap.set(lesson.title, createdLesson.id);
    console.log(`  ✅ Lección creada: ${lesson.title} (${createdLesson.id})`);
  }

  // 3. Crear preguntas Y respuestas, luego relacionarlas con lecciones
  let questionIndexInLesson = 0;

  for (const lesson of data.lessons) {
    const lessonId = lessonMap.get(lesson.title);
    if (!lessonId) {
      console.error(`  ❌ No se encontró lección: ${lesson.title}`);
      continue;
    }

    questionIndexInLesson = 0;

    for (const question of lesson.questions) {
      // Crear pregunta con courseId directo
      const createdQuestion = await prisma.question.create({
        data: {
          questionText: question.questionText,
          explanationText: question.explanationText,
          difficulty: question.difficulty,
          type: question.type,
          from: question.from,
          courseId: createdCourse.id, // ✅ Directo del curso, no de lección
        },
      });

      // Crear respuestas
      for (const answer of question.answers) {
        await prisma.answer.create({
          data: {
            answerText: answer.answerText,
            isCorrect: answer.isCorrect,
            questionId: createdQuestion.id,
          },
        });
      }

      // Crear relación many-to-many entre lección y pregunta
      await prisma.lessonQuestion.create({
        data: {
          lessonId: lessonId,
          questionId: createdQuestion.id,
          orderIndex: questionIndexInLesson,
        },
      });

      questionIndexInLesson++;
      console.log(
        `    ✅ Pregunta creada y agregada a lección: ${createdQuestion.id}`
      );
    }
  }

  console.log(`[SUCCESS] Curso "${data.course.name}" creado con éxito.\n`);
}

export async function seedAllJsonFiles() {
  const prisma = createPrismaClient();
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const dataDirPath = path.resolve(currentDir, "..", "data");

  try {
    const files = await fs.readdir(dataDirPath);
    const jsonFiles = files
      .filter((f) => f.endsWith(".json") && f.startsWith("seed-unsaac-"))
      .sort();

    for (const file of jsonFiles) {
      await seedFile(path.join(dataDirPath, file), prisma);
    }
  } catch (error) {
    console.error("[FATAL_ERROR]", error);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution = fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  seedAllJsonFiles().catch((error) => {
    console.error("[MAIN_SEED_ERROR]", error);
    process.exit(1);
  });
}