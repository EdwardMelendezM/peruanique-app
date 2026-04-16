"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon, Eye, EyeOff } from "lucide-react"; // Importamos los ojos
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  register?: any;
}

export function FormField({
                            label,
                            error,
                            icon: Icon,
                            type = "text",
                            register,
                            placeholder,
                            className,
                            id,
                            ...props
                          }: FormFieldProps) {
  // 1. Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = React.useState(false);

  const generatedId = id || label.toLowerCase().replace(/\s+/g, "-");

  // 2. Determinar el tipo de input dinámicamente
  const isPasswordField = type === "password";
  const currentType = isPasswordField && showPassword ? "text" : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2 w-full">
      <Label
        htmlFor={generatedId}
        className={cn(error && "text-destructive font-semibold")}
      >
        {label}
      </Label>

      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary z-10">
            <Icon className={cn(
              "h-5 w-5 text-muted-foreground",
              error && "text-destructive/80"
            )} />
          </div>
        )}

        <Input
          id={generatedId}
          type={currentType}
          placeholder={placeholder}
          className={cn(
            "h-12 transition-all shadow-sm",
            Icon ? "pl-10" : "",
            isPasswordField ? "pr-10" : "", // Espacio para el ojo
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...register}
          {...props}
        />

        {/* 3. Botón para mostrar contraseña (solo si es tipo password) */}
        {isPasswordField && (
          <button
            type="button" // Importante: evita que haga submit al formulario
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
