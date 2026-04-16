"use client";

import * as React from "react";
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  FileQuestion,
  CheckCircle2,
  Code2,
  Library,
  GitBranch,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils";

const navigation = [
  {
    title: "Gestión de Contenido",
    items: [
      {title: "Dashboard", href: "/admin", icon: LayoutDashboard},
      {title: "Biblioteca Global", href: "/admin/library", icon: Library},
      {title: "Constructor Roadmap", href: "/admin/roadmap", icon: GitBranch},
    ],
  },
  {
    title: "Legacy (Antiguo)",
    items: [
      {title: "Cursos", href: "/admin/courses", icon: BookOpen},
      {title: "Lecciones", href: "/admin/lessons", icon: Code2},
      {title: "Preguntas", href: "/admin/questions", icon: FileQuestion},
      {title: "Respuestas", href: "/admin/answers", icon: CheckCircle2},
    ],
  },
  {
    title: "Sistema",
    items: [
      {title: "Usuarios", href: "/dashboard/users", icon: Users},
      {title: "Configuración", href: "/dashboard/settings", icon: Settings},
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/40 bg-card">
      <SidebarHeader className="h-16 border-b border-border/40 px-6 flex items-center">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5"/>
          </div>
          <span className="font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            FIJA Admin
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel
              className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {group.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-2 transition-all duration-200",
                        isActive
                          ? "bg-primary/5 text-primary font-bold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("h-4 w-4", isActive && "text-primary")}/>
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="absolute left-0 h-5 w-1 rounded-r-full bg-primary"/>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={'/logout'}
            >
              <SidebarMenuButton
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="h-4 w-4"/>
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
