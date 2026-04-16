import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

type GetSessionResult =
  | { success: true; user: SessionUser }
  | { success: false; error: string };

export const getSession = async (): Promise<GetSessionResult> => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session) {
    return {
      success: false,
      error: "Session not found"
    };
  }

  return {
    success: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null,
    }
  };
}
