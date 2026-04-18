// DEPRECATED: Las lecciones ya no pertenecen a cursos.
// Las lecciones ahora son entidades independientes que pueden contener preguntas de múltiples cursos.
// Usa features/lessons/ para gestionar lecciones en su lugar.

// Este archivo se mantiene solo como referencia histórica.
// TODO: Eliminar este archivo una vez que las lecciones estén completamente migradas a features/lessons/

export type CourseLessonItem = {
  id: string;
  title: string;
  description: string | null;
  questionsCount: number;
  updatedAt: Date;
};

export type CourseLessonTree = {
  course: {
    id: string;
    name: string;
  };
  lessons: CourseLessonItem[];
};

// Funcionalidad deshabilitada - ver features/lessons/ para el nuevo sistema
export async function getCourseLessons(
  _courseId: string
): Promise<{ success: false; error: string }> {
  return {
    success: false,
    error: "Las lecciones ahora son independientes de los cursos. Usa features/lessons/ para acceder a ellas.",
  };
}
