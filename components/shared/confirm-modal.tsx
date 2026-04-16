"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import {cn} from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  loading?: boolean;
  variant?: "default" | "destructive";
}

export function ConfirmModal({
                               isOpen,
                               onOpenChange,
                               onConfirm,
                               title,
                               description,
                               loading = false,
                               variant = "destructive"
                             }: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="rounded-lg font-bold" disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={cn(
              "rounded-lg font-bold shadow-sm",
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
