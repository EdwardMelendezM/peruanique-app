import { cn } from "@/lib/utils";

interface EmptyPlaceholderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyPlaceholder({
                                   icon: Icon,
                                   title,
                                   description,
                                   action,
                                   className
                                 }: EmptyPlaceholderProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500",
      className
    )}>
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-6">
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-[280px] mb-8">
        {description}
      </p>
      {action}
    </div>
  );
}
