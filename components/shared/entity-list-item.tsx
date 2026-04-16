import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface EntityListItemProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  footerActions?: React.ReactNode;
  className?: string;
}

export function EntityListItem({
                                 icon,
                                 title,
                                 subtitle,
                                 metadata,
                                 actions,
                                 footerActions,
                                 className
                               }: EntityListItemProps) {
  return (
    <Card className={cn(
      "group relative border border-border/60 bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden",
      className
    )}>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Contenedor de Icono usando tokens secundarios y primarios */}
            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/20 transition-colors">
              {icon}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {subtitle}
              </div>

              <div className="text-lg font-bold tracking-tight text-foreground">
                {title}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                {metadata}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {actions}
          </div>
        </div>

        {footerActions && (
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/40 pt-4">
            {footerActions}
          </div>
        )}
      </div>
    </Card>
  );
}
