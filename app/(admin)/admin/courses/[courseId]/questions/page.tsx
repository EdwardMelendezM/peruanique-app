import { getCourseQuestionTree } from "@/features/courses/actions/course-content-queries";
import { CourseQuestionsScreen } from "@/features/courses/screens/course-questions-screen";

interface CourseQuestionsPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseQuestionsPage({ params }: CourseQuestionsPageProps) {
  const { courseId } = await params;
  const result = await getCourseQuestionTree(courseId);

  if (!result.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-muted-foreground">
        {result.error}
      </div>
    );
  }

  return <CourseQuestionsScreen data={result.data} />;
}

