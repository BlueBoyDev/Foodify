import React from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "foodify" | "codex";
}

export const Logo: React.FC<LogoProps> = ({ className, variant = "foodify" }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-foodify-orange p-1.5 rounded-lg">
        <UtensilsCrossed className="w-6 h-6 text-white" />
      </div>
      <span className={cn(
        "text-2xl font-black tracking-tight",
        variant === "codex" ? "text-white" : "text-foodify-orange"
      )}>
        {variant === "codex" ? "CODEX" : "Foodify"}
      </span>
    </div>
  );
};
