import { getCourseById, updateCourse } from "@/features/courses/actions/course-actions";
import { CourseFormScreen } from "@/features/courses/screens/course-form-screen";

interface CourseEditPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseEditPage({ params }: CourseEditPageProps) {
  const { courseId } = await params;
  const result = await getCourseById(courseId);

  if (!result.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-muted-foreground">
        {result.error}
      </div>
    );
  }

  return <CourseFormScreen mode="edit" action={updateCourse} course={result.course} />;
}

