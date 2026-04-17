"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import {
  courseCreateSchema,
  courseIdOnlySchema,
  courseUpdateSchema,
  type CourseCreateInput,
  type CourseUpdateInput,
} from "../schemas/course-schemas";

export type CourseListItem = {
  id: string;
  name: string;
  colorTheme: string | null;
  iconUrl: string | null;
  lessonsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseDetail = CourseListItem;

export type CourseActionState = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "colorTheme" | "iconUrl" | "id", string>>;
  courseId?: string;
};

const getStringValue = (value: FormDataEntryValue | null) => {
  return typeof value === "string" ? value : "";
};

const mapCreateFormData = (formData: FormData): CourseCreateInput => {
  return {
    name: getStringValue(formData.get("name")),
    colorTheme: getStringValue(formData.get("colorTheme")),
    iconUrl: getStringValue(formData.get("iconUrl")),
  };
};

const mapUpdateFormData = (formData: FormData): CourseUpdateInput => {
  return {
    id: getStringValue(formData.get("id")),
    name: getStringValue(formData.get("name")),
    colorTheme: getStringValue(formData.get("colorTheme")),
    iconUrl: getStringValue(formData.get("iconUrl")),
  };
};

export async function getCourses(): Promise<CourseListItem[]> {
  const courses = await prisma.course.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    colorTheme: course.colorTheme,
    iconUrl: course.iconUrl,
    lessonsCount: course._count.lessons,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }));
}

export async function getCourseById(courseId: string): Promise<{ success: true; course: CourseDetail } | { success: false; error: string }> {
  const parsed = courseIdOnlySchema.safeParse({ id: courseId });
  if (!parsed.success) {
    return { success: false, error: "El curso solicitado no es válido" };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.id },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!course) {
    return { success: false, error: "No se encontró el curso solicitado" };
  }

  return {
    success: true,
    course: {
      id: course.id,
      name: course.name,
      colorTheme: course.colorTheme,
      iconUrl: course.iconUrl,
      lessonsCount: course._count.lessons,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    },
  };
}

export async function createCourse(
  _state: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = courseCreateSchema.safeParse(mapCreateFormData(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<CourseActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "colorTheme" || key === "iconUrl") {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      error: "Revisa los campos marcados",
      fieldErrors,
    };
  }

  const course = await prisma.course.create({
    data: {
      name: parsed.data.name,
      colorTheme: parsed.data.colorTheme,
      iconUrl: parsed.data.iconUrl,
    },
  });

  revalidatePath("/admin/courses");

  return {
    success: true,
    courseId: course.id,
    message: "Curso creado correctamente",
  };
}

export async function updateCourse(
  _state: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = courseUpdateSchema.safeParse(mapUpdateFormData(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<CourseActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "id" || key === "name" || key === "colorTheme" || key === "iconUrl") {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      error: "Revisa los campos marcados",
      fieldErrors,
    };
  }

  const existingCourse = await prisma.course.findUnique({
    where: { id: parsed.data.id },
  });

  if (!existingCourse) {
    return {
      success: false,
      error: "No se encontró el curso para actualizar",
    };
  }

  const course = await prisma.course.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      colorTheme: parsed.data.colorTheme,
      iconUrl: parsed.data.iconUrl,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${course.id}/edit`);

  return {
    success: true,
    courseId: course.id,
    message: "Curso actualizado correctamente",
  };
}

export async function deleteCourse(courseId: string): Promise<CourseActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = courseIdOnlySchema.safeParse({ id: courseId });
  if (!parsed.success) {
    return {
      success: false,
      error: "El curso solicitado no es válido",
    };
  }

  const existingCourse = await prisma.course.findUnique({
    where: { id: parsed.data.id },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!existingCourse) {
    return {
      success: false,
      error: "No se encontró el curso para eliminar",
    };
  }

  await prisma.course.delete({
    where: { id: parsed.data.id },
  });

  revalidatePath("/admin/courses");

  return {
    success: true,
    message:
      existingCourse._count.lessons > 0
        ? `Curso eliminado junto con ${existingCourse._count.lessons} lección(es)`
        : "Curso eliminado correctamente",
  };
}

