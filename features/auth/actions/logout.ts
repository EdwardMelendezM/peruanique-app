"use server";

import { revalidatePath } from "next/cache";

export async function clearServerCache() {
  // Esto limpia la caché de datos de Next.js
  revalidatePath("/", "layout");
}
