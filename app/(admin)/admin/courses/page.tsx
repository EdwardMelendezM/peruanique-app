import { getCourses } from "@/features/courses/actions/course-actions";
import { CoursesListScreen } from "@/features/courses/screens/courses-list-screen";
import { getSession } from "@/lib/get-session"

export default async function CoursesPage() {
  const session = await getSession()
  if (!session.success) {
    return <div className="p-4">No autorizado</div>;
  }
  const courses = await getCourses();

  return <CoursesListScreen courses={courses} />;
}

