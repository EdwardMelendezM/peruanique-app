import Link from "next/link";
import { ArrowLeft, NotebookTabs } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { CourseQuestionTreeWithLessons } from "../actions/course-content-queries";
import { CourseQuestionsManager } from "../components/questions/course-questions-manager";

interface CourseQuestionsScreenProps {
  data: CourseQuestionTreeWithLessons;
}

export function CourseQuestionsScreen({ data }: CourseQuestionsScreenProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Preguntas y respuestas"
        description="Gestiona el banco de preguntas del curso y sus respuestas de forma anidada."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/admin/courses/${data.course.id}/lessons`}>
                <NotebookTabs className="mr-2 h-4 w-4" />
                Gestionar lecciones
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a cursos
              </Link>
            </Button>
          </>
        }
      />

      <CourseQuestionsManager courseId={data.course.id} courseName={data.course.name} lessons={data.lessons} />
    </div>
  );
}

