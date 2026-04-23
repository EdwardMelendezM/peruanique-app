import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { Group } from "@/app/generated/prisma/client"
import { Prisma__UserClient } from "@/app/generated/prisma/models/User"

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().trim().min(2),
  fullName: z.string().trim().min(2),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateMeBodySchema = z
  .object({
    username: z.string().trim().min(2).optional(),
    fullName: z.string().trim().min(2).optional(),
    groupId: z.string().uuid().nullable().optional(),
    birthDate: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => data.username !== undefined || data.fullName !== undefined || data.groupId !== undefined || data.birthDate !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export type MobileApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export const jsonSuccess = <T>(data: T, status = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

export const jsonError = (
  code: MobileApiErrorCode,
  message: string,
  status = 400
) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
};

export const mapStatusToErrorCode = (status: number): MobileApiErrorCode => {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status === 422) return "VALIDATION_ERROR";
  return "SERVER_ERROR";
};

export const getRequestJson = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

export const toCookieHeader = (setCookies: string[]) => {
  return setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
};

export const getSetCookies = (response: Response) => {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }

  const singleCookie = response.headers.get("set-cookie");
  return singleCookie ? [singleCookie] : [];
};

export const copySetCookies = (source: Response, target: NextResponse) => {
  for (const cookie of getSetCookies(source)) {
    target.headers.append("set-cookie", cookie);
  }
};

export const forwardAuthRequest = async (
  request: NextRequest,
  path: string,
  body?: unknown
) => {
  const headers = new Headers(request.headers);
  headers.set("accept", "application/json");

  const requestInit: RequestInit = {
    method: "POST",
    headers,
  };

  if (body !== undefined) {
    headers.set("content-type", "application/json");
    requestInit.body = JSON.stringify(body);
  }

  const proxiedRequest = new Request(new URL(path, request.url), requestInit);
  return auth.handler(proxiedRequest);
};

export const parseAuthJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const mapDbUserToMobile = (user: {
  id: string;
  email: string;
  full_name: string;
  name: string | null;
  group?: Group | null;
  isDisabled: boolean;
}) => ({
  id: user.id,
  email: user.email,
  username: user.name ?? "",
  fullName: user.full_name,
  group: user?.group ?? "",
  birthDate: null as string | null,
  isActive: !user.isDisabled,
});

export const sevenDaysFromNow = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
};

export const getCurrentMobileUser = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      currentEnergy: true,
      lastEnergyRefill: true,
      group: true,
    }
  })
}