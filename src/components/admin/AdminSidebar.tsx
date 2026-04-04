import { forwardRef } from "react";
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Ticket,
  Truck,
  CreditCard,
  Settings,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pedidos", url: "/pedidos", icon: ShoppingBag },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Categorias", url: "/categorias", icon: FolderTree },
  { title: "Cupons", url: "/cupons", icon: Ticket },
  { title: "Entregas", url: "/entregas", icon: Truck },
  { title: "Pagamentos", url: "/pagamentos", icon: CreditCard },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Caixa", url: "/caixa", icon: Landmark },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm">P+</span>
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
              Pod & Mais
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
