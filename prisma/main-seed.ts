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

  // Creamos el árbol de contenido de forma secuencial para evitar cortes de conexión en poolers.
  const createdCourse = await prisma.course.create({
    data: {
      name: data.course.name,
      colorTheme: data.course.colorTheme,
      iconUrl: data.course.iconUrl,
    },
  });

  for (const lesson of data.lessons) {
    const createdLesson = await prisma.lesson.create({
      data: {
        title: lesson.title,
        description: lesson.description,
        courseId: createdCourse.id,
      },
    });

    for (const question of lesson.questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          questionText: question.questionText,
          explanationText: question.explanationText,
          difficulty: question.difficulty,
          type: question.type,
          from: question.from,
          lessonId: createdLesson.id,
        },
      });

      for (const answer of question.answers) {
        await prisma.answer.create({
          data: {
            answerText: answer.answerText,
            isCorrect: answer.isCorrect,
            questionId: createdQuestion.id,
          },
        });
      }
    }
  }
  console.log(`[SUCCESS] Curso "${data.course.name}" creado con éxito.`);
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