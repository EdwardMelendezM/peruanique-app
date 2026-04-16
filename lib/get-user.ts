"use server"

import { prisma } from "@/lib/prisma";
import {getSession} from "@/lib/get-session";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export const getCurrentUser = async () => {
  try {
    const session = await getSession();
    console.log("[SESSION]", session);
    if (!session.success) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
        image: true,
        full_name: true,
      },
    })

    if (!user) {
      console.error("User not found by email:", session.user.email);
      return null;
    }

    const currentUser: CurrentUser = {
      id: user.id,
      email: user.email,
      name: user.full_name || "",
      image: user.image || "",
    }

    return currentUser;
  } catch (error) {
    console.error("[ERROR_GET_USER]", error);
    return null;
  }
}
