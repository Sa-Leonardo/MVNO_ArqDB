import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import type { ChipStatus, RecargaStatus, AssinaturaStatus } from "@/types/api";

type BadgeTone = "neutral" | "green" | "blue" | "yellow" | "red" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium",
        tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-700",
        tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "blue" && "border-sky-200 bg-sky-50 text-sky-700",
        tone === "yellow" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700",
        tone === "purple" && "border-violet-200 bg-violet-50 text-violet-700",
        className
      )}
      {...props}
    />
  );
}

export function ChipStatusBadge({ status }: { status: ChipStatus }) {
  const tone: Record<ChipStatus, BadgeTone> = {
    available: "neutral",
    reserved: "yellow",
    active: "green",
    suspended: "red",
    canceled: "red"
  };
  return <Badge tone={tone[status]}>{status}</Badge>;
}

export function RecargaStatusBadge({ status }: { status: RecargaStatus }) {
  const tone: Record<RecargaStatus, BadgeTone> = {
    pending: "yellow",
    approved: "green",
    rejected: "red"
  };
  return <Badge tone={tone[status]}>{status}</Badge>;
}

export function AssinaturaStatusBadge({ status }: { status: AssinaturaStatus }) {
  const tone: Record<AssinaturaStatus, BadgeTone> = {
    active: "green",
    paused: "yellow",
    canceled: "red"
  };
  return <Badge tone={tone[status]}>{status}</Badge>;
}
