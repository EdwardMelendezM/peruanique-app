"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Planes", href: "/admin/plans", icon: Tag },
  { label: "Paquetes de créditos", href: "/admin/credit-packages", icon: Coins },
];

export function AdminMonetizationTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1 w-fit">
      {TABS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
