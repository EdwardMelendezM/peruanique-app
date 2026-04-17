import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "../../_lib/mobile-auth";

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return jsonSuccess(groups, 200);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch groups", 500);
  }
}


