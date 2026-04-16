import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "../components/register-form";

export async function RegisterScreen() {
  const session = await getSession();
  if (session.success) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-[#030a50]">Crear cuenta</CardTitle>
          <CardDescription>Registrate para acceder a SODU.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}

