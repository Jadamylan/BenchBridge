import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition disabled:opacity-40",
  {
    variants: {
      variant: {
        orange: "border-orange bg-orange text-ink hover:bg-paper",
        ghost: "border-line bg-transparent text-paper hover:border-paper",
        paper: "border-paper bg-paper text-ink hover:bg-orange hover:border-orange",
      },
    },
    defaultVariants: { variant: "orange" },
  },
);

export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}
