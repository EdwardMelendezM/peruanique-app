import { createCourse } from "@/features/courses/actions/course-actions";
import { CourseFormScreen } from "@/features/courses/screens/course-form-screen";

export default function NewCoursePage() {
  return <CourseFormScreen mode="create" action={createCourse} />;
}

