import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { CourseListItemCard } from "../components/course-list-item";
import type { CourseListItem } from "../actions/course-actions";

interface CoursesListScreenProps {
  courses: CourseListItem[];
}

export function CoursesListScreen({ courses }: CoursesListScreenProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Cursos"
        description="Administra la biblioteca global de cursos disponibles para lecciones y roadmaps."
        actions={
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo curso
            </Link>
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyPlaceholder
          icon={BookOpen}
          title="No hay cursos registrados"
          description="Crea el primer curso para comenzar a organizar lecciones dentro de la biblioteca global."
          action={
            <Button asChild>
              <Link href="/admin/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear curso
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <CourseListItemCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

