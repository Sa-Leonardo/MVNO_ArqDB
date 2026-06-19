import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-sky-100 disabled:bg-muted",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
