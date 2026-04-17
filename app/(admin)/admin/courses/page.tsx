import { getCourses } from "@/features/courses/actions/course-actions";
import { CoursesListScreen } from "@/features/courses/screens/courses-list-screen";

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CoursesListScreen courses={courses} />;
}

