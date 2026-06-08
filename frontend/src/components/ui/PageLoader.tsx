import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}
