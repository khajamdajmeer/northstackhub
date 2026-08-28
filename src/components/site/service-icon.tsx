import {
  Bot,
  Brain,
  Cloud,
  CreditCard,
  Database,
  GraduationCap,
  Layers,
  Orbit,
  PenTool,
  Server,
  Shield,
  ShoppingCart,
  Smartphone,
  Wrench,
} from "lucide-react";
import type { Service } from "@/content/services";
import { cn } from "@/lib/utils";

const icons = {
  layers: Layers,
  smartphone: Smartphone,
  brain: Brain,
  bot: Bot,
  shopping: ShoppingCart,
  "credit-card": CreditCard,
  server: Server,
  database: Database,
  cloud: Cloud,
  shield: Shield,
  graduation: GraduationCap,
  orbit: Orbit,
  pen: PenTool,
  wrench: Wrench,
} as const;

export function ServiceIcon({
  name,
  className,
}: {
  name: Service["icon"];
  className?: string;
}) {
  const Icon = icons[name];
  return (
    <span
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-lg border border-brand/25 bg-brand-soft text-brand",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}
