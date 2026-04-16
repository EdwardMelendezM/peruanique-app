import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "outline" | "secondary";
  className?: string;
}

export function StatusBadge({ children, variant = "default", className }: StatusBadgeProps) {
  const variants = {
    default: "bg-muted text-muted-foreground border-transparent",
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    outline: "bg-transparent border-border text-muted-foreground",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
