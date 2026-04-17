import Link from "next/link";
import { BookOpen, GitBranch, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  {
    title: "Cursos",
    description: "Gestiona cursos y su estructura base.",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Grupos",
    description: "Administra grupos para asignación de usuarios y roadmap.",
    href: "/admin/groups",
    icon: Users,
  },
  {
    title: "Roadmap",
    description: "Configura la secuencia de lecciones por grupo.",
    href: "/admin/roadmap",
    icon: GitBranch,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Panel principal para administrar contenidos FIJA.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="h-full border-border/60 transition hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

