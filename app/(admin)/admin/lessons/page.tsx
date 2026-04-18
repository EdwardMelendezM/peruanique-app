import { PageHeader } from "@/components/shared/page-header";
import { LessonManager } from "@/features/lessons/components/lesson-manager";
import { getAllLessons } from "@/features/lessons/actions/lesson-queries";

export default async function LessonsPage() {
  const lessonsResult = await getAllLessons();

  if (!lessonsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground font-medium">
        {lessonsResult.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecciones"
        description="Gestiona lecciones que pueden agrupar preguntas de múltiples cursos."
      />
      <LessonManager lessons={lessonsResult.lessons} />
    </div>
  );
}

