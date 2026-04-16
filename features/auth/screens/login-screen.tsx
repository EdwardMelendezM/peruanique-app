import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../components/login-form";

export async function LoginScreen() {
  const session = await getSession();
  if (session.success) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-[#030a50]">Iniciar sesion</CardTitle>
          <CardDescription>Accede a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}

