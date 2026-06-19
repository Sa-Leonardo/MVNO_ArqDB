import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-warning" />
      <Outlet />
    </main>
  );
}
