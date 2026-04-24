import { prisma } from '@/lib/prisma';

export async function getOfflineContent(groupId: string) {
  // 1. Obtener el Roadmap y las Lecciones asociadas
  const roadmapNodes = await prisma.roadmapNode.findMany({
    where: { groupId },
    include: {
      lesson: true,
    },
    orderBy: { orderIndex: 'asc' },
  });

  const lessonIds = roadmapNodes.map((n) => n.lessonId);

  // 2. Obtener la relación Many-to-Many de preguntas para esas lecciones
  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { lessonId: { in: lessonIds } },
    orderBy: { orderIndex: 'asc' },
  });

  const questionIds = lessonQuestions.map((lq) => lq.questionId);

  // 3. Obtener las Preguntas, sus Respuestas y sus Cursos
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: {
      answers: true,
      course: true,
    },
  });

  // 4. Aplanar la data para cumplir con el esquema de Drizzle (Mobile)
  // Usamos un Map para evitar duplicados de cursos
  const coursesMap = new Map();

  const formattedQuestions = questions.map((q) => {
    if (!coursesMap.has(q.course.id)) {
      coursesMap.set(q.course.id, q.course);
    }

    return {
      id: q.id,
      courseId: q.courseId,
      questionText: q.questionText,
      explanationText: q.explanationText,
      difficulty: q.difficulty,
      type: q.type,
      from_source: q.from, // Mapeo de 'from' (Prisma) a 'from_source' (Drizzle)
      updatedAt: q.updatedAt.getTime(), // Convertimos Date a timestamp para SQLite
    };
  });

  return {
    courses: Array.from(coursesMap.values()).map(c => ({
      ...c,
      updatedAt: c.updatedAt.getTime(),
    })),
    lessons: roadmapNodes.map(rn => ({
      ...rn.lesson,
      updatedAt: rn.lesson.updatedAt.getTime(),
    })),
    questions: formattedQuestions,
    answers: questions.flatMap(q => q.answers.map(a => ({
      id: a.id,
      questionId: a.questionId,
      answerText: a.answerText,
      isCorrect: a.isCorrect,
    }))),
    roadmap: roadmapNodes.map(({ lesson, ...node }) => ({
      ...node,
      updatedAt: node.updatedAt.getTime(),
    })),
    lessonQuestions: lessonQuestions.map(lq => ({
      ...lq,
      updatedAt: lq.updatedAt.getTime(),
    })),
  };
}