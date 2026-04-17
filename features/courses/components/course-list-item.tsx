import Link from "next/link";
import { BookOpen, MessageSquare, NotebookTabs, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityListItem } from "@/components/shared/entity-list-item";
import { CourseDeleteButton } from "./course-delete-button";
import type { CourseListItem } from "../actions/course-actions";

interface CourseListItemProps {
  course: CourseListItem;
}

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
};

export function CourseListItemCard({ course }: CourseListItemProps) {
  return (
    <EntityListItem
      icon={<BookOpen className="h-5 w-5" />}
      subtitle={<Badge variant="secondary">Curso</Badge>}
      title={course.name}
      metadata={
        <>
          <span>{course.lessonsCount} lección(es)</span>
          <span>Actualizado {formatDate(course.updatedAt)}</span>
          {course.colorTheme ? <span>Tema: {course.colorTheme}</span> : null}
        </>
      }
      actions={<Badge variant="outline">ID {course.id.slice(0, 8)}</Badge>}
      footerActions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/courses/${course.id}/lessons`}>
              <NotebookTabs className="mr-2 h-4 w-4" />
              Lecciones
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/courses/${course.id}/questions`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Preguntas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/courses/${course.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <CourseDeleteButton
            courseId={course.id}
            courseName={course.name}
            lessonsCount={course.lessonsCount}
          />
        </>
      }
    />
  );
}

