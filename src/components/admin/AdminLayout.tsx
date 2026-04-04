import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  const handleLogout = () => {
    // Pronto para integração futura
    console.log("logout");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                Administrador
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
