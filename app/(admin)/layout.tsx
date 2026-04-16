import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";

export default function DashboardLayout({
                                          children,
                                        }: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar/>
        <main className="flex-1 flex flex-col">
          {/* Header persistente en la parte superior */}
          <header
            className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-card/50 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"/>
              <div className="h-4 w-[1px] bg-border/60"/>
              <p className="text-sm font-medium text-muted-foreground">Panel de Control</p>
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
