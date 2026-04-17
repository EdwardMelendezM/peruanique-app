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
import { registerSchema, type RegisterInput } from "../schemas/auth-schemas";

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setIsSubmitting(true);
    const response = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);

    if (response.error) {
      const message = response.error.message || "No se pudo registrar";
      toast.error(message);
      setError("root", { message });
      return;
    }

    toast.success("Cuenta creada correctamente");
    router.push("/courses");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Nombre completo"
        placeholder="Nombre y apellido"
        error={errors.name?.message}
        register={register("name")}
      />
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
      <FormField
        label="Confirmar contrasena"
        type="password"
        error={errors.confirmPassword?.message}
        register={register("confirmPassword")}
      />
      {errors.root?.message ? (
        <p className="text-xs font-semibold text-destructive">{errors.root.message}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link className="font-semibold text-[#be8a34]" href="/login">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}

