import { getCourseLessons } from "@/features/courses/actions/course-lesson-queries";
import { CourseLessonsScreen } from "@/features/courses/screens/course-lessons-screen";

interface CourseLessonsPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseLessonsPage({ params }: CourseLessonsPageProps) {
  const { courseId } = await params;
  const result = await getCourseLessons(courseId);

  if (!result.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-muted-foreground">
        {result.error}
      </div>
    );
  }

  return <CourseLessonsScreen data={result.data} />;
}

