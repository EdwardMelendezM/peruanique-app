import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CourseLessonsManager } from "../components/lessons/course-lessons-manager";
import type { CourseLessonTree } from "../actions/course-lesson-queries";

interface CourseLessonsScreenProps {
  data: CourseLessonTree;
}

export function CourseLessonsScreen({ data }: CourseLessonsScreenProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Lecciones"
        description="Administra las lecciones del curso antes de crear preguntas y respuestas."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/admin/courses/${data.course.id}/questions`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Gestionar preguntas
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

      <CourseLessonsManager courseId={data.course.id} courseName={data.course.name} lessons={data.lessons} />
    </div>
  );
}

