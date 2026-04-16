import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadMoreButtonProps {
  handleLoadMore: () => void;
  hasMore: boolean;
  isPending: boolean;
  currentCount: number;
  totalCount: number;
  label?: string;
  loadingLabel?: string;
  className?: string;
}

export function LoadMoreButton({
                                 handleLoadMore,
                                 hasMore,
                                 isPending,
                                 currentCount,
                                 totalCount,
                                 label = "Mostrar más",
                                 loadingLabel = "Cargando...",
                                 className,
                               }: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <div className={cn("flex justify-center mt-12 pb-12", className)}>
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={handleLoadMore}
        className="rounded-full px-8 h-12 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-sm border border-border/40"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <ChevronDown className="h-5 w-5 mr-2" />
        )}

        <span>{isPending ? loadingLabel : label}</span>

        {totalCount > 0 && (
          <span className="ml-2 text-sm text-primary font-medium">
            ({currentCount} de {totalCount})
          </span>
        )}
      </Button>
    </div>
  );
}
