import Link from "next/link";
import { ArrowLeft, MessageSquare, NotebookTabs } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CourseForm } from "../components/course-form";
import type { CourseActionState, CourseDetail } from "../actions/course-actions";

interface CourseFormScreenProps {
  mode: "create" | "edit";
  action: (state: CourseActionState, formData: FormData) => Promise<CourseActionState>;
  course?: CourseDetail;
}

export function CourseFormScreen({ mode, action, course }: CourseFormScreenProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={mode === "create" ? "Nuevo curso" : "Editar curso"}
        description={
          mode === "create"
            ? "Crea un curso reutilizable para organizar lecciones y roadmaps."
            : "Actualiza la información general del curso."
        }
        actions={
          <>
            {mode === "edit" && course ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/admin/courses/${course.id}/lessons`}>
                    <NotebookTabs className="mr-2 h-4 w-4" />
                    Gestionar lecciones
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/courses/${course.id}/questions`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Gestionar preguntas
                  </Link>
                </Button>
              </>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/admin/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <CourseForm
            mode={mode}
            action={action}
            initialValues={
              course
                ? {
                    id: course.id,
                    name: course.name,
                    colorTheme: course.colorTheme,
                    iconUrl: course.iconUrl,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

