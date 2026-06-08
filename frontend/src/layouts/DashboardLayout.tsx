import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RadioTower,
  Smartphone,
  Users,
  WalletCards
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { canManageUsers } from "@/utils/rbac";
import { cn } from "@/utils/cn";

const baseNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { label: "Chips", href: "/dashboard/chips", icon: Smartphone },
  { label: "Planos", href: "/dashboard/planos", icon: WalletCards },
  { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 }
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = canManageUsers(user?.role)
    ? [...baseNav, { label: "Usuários", href: "/dashboard/usuarios", icon: CreditCard }]
    : baseNav.filter((item) => item.label !== "Planos");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
            <RadioTower className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">MVNO Admin</p>
            <p className="text-xs text-slate-500">Operação telecom</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-muted hover:text-ink",
                    isActive && "bg-sky-50 text-primary"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-sm font-semibold text-ink">Painel operacional</p>
            <p className="text-xs text-slate-500">Chips, ativações, clientes e recargas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{user?.name}</p>
              <p className="text-xs uppercase text-slate-500">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
