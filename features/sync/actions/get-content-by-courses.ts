import { prisma } from "@/lib/prisma"

export async function getContentByCourses(courseIds: string[]) {
  const questions = await prisma.question.findMany({
    where: { courseId: { in: courseIds } },
    include: { answers: true },
  });

  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { questionId: { in: questions.map(q => q.id) } },
  });

  return {
    questions: questions.map(q => ({
      id: q.id,
      courseId: q.courseId,
      questionText: q.questionText,
      explanationText: q.explanationText,
      difficulty: q.difficulty,
      type: q.type,
      from_source: q.from,
      isDisabled: q.isDisabled,
      updatedAt: q.updatedAt.getTime(),
    })),
    answers: questions.flatMap(q => q.answers.map(a => ({
      ...a,
      updatedAt: a.updatedAt.getTime(),
    }))),
    lessonQuestions: lessonQuestions.map(lq => ({
      ...lq,
      updatedAt: lq.updatedAt.getTime(),
    })),
  };
}