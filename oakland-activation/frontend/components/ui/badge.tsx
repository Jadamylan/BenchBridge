import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        public: "border-ok/70 text-ok",
        demo: "border-warn text-warn",
        partner: "border-dashed border-steel text-steel",
        neutral: "border-line text-steel",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, children }: { className?: string; children: ReactNode } & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "PUBLIC" ? "public" : status === "DEMO" ? "demo" : status === "PARTNER_REQUIRED" ? "partner" : "neutral";
  const label = status === "PARTNER_REQUIRED" ? "Partner required" : status === "PUBLIC" ? "Public" : status === "DEMO" ? "Demo" : status;
  return <Badge tone={tone}>{label}</Badge>;
}
