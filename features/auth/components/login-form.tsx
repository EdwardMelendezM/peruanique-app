"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "../schemas/auth-schemas";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsSubmitting(true);
    const response = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: true,
    });
    setIsSubmitting(false);

    if (response.error) {
      const message = response.error.message || "No se pudo iniciar sesion";
      toast.error(message);
      setError("root", { message });
      return;
    }

    toast.success("Bienvenido de nuevo");
    router.push("/admin/courses");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Correo"
        placeholder="correo@unsaac.edu.pe"
        type="email"
        error={errors.email?.message}
        register={register("email")}
      />
      <FormField
        label="Contrasena"
        type="password"
        error={errors.password?.message}
        register={register("password")}
      />
      {errors.root?.message ? (
        <p className="text-xs font-semibold text-destructive">{errors.root.message}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link className="font-semibold text-[#be8a34]" href="/register">
          Registrate
        </Link>
      </p>
    </form>
  );
}

