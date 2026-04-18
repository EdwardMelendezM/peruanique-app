import { PageHeader } from "@/components/shared/page-header";
import { LessonQuestionsDetail } from "@/features/lessons/components/lesson-questions-detail";
import { getLessonWithQuestionsAndAnswers } from "@/features/lessons/actions/lesson-queries";
import { getAllCourses } from "@/features/courses/actions/course-content-queries";
import { getCourseQuestionTree } from "@/features/courses/actions/course-content-queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface LessonQuestionsPageProps {
  params: Promise<{
    lessonId: string;
  }>
}

export default async function LessonQuestionsPage({ params }: LessonQuestionsPageProps) {
  const { lessonId } = await params;
  const [lessonResult, coursesResult] = await Promise.all([
    getLessonWithQuestionsAndAnswers(lessonId),
    getAllCourses(),
  ]);

  if (!lessonResult.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-muted-foreground font-medium">{lessonResult.error}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/lessons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a lecciones
          </Link>
        </Button>
      </div>
    );
  }

  const courses = coursesResult.success ? coursesResult.courses : [];

  // Pre-fetch all course questions for the selector to use
  const courseQuestionsMap: Record<string, any> = {};
  if (courses.length > 0) {
    const results = await Promise.all(
      courses.map((course) => getCourseQuestionTree(course.id))
    );
    
    results.forEach((result, index) => {
      if (result.success) {
        courseQuestionsMap[courses[index].id] = result.data.questions;
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <PageHeader
            title={lessonResult.lesson.title}
            description="Gestiona las preguntas de esta lección"
          />
          {lessonResult.lesson.description && (
            <p className="text-sm text-muted-foreground">{lessonResult.lesson.description}</p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/lessons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <LessonQuestionsDetail
        lesson={lessonResult.lesson}
        courses={courses}
        courseQuestionsMap={courseQuestionsMap}
      />
    </div>
  );
}

