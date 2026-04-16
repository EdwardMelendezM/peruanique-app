import { createAuthClient } from "better-auth/client";
import {variables} from "@/config/var";

export const authClient = createAuthClient({
  baseURL: variables.BETTER_AUTH_URL,
});
