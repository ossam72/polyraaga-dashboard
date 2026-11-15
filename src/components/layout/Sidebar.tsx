"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ShoppingBag,
  Package,
  BarChart3,
  Bot,
  CreditCard,
  Settings,
  Workflow,
  KanbanSquare,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox", href: "/dashboard/chat", icon: MessageSquare },
  { name: "CRM", href: "/dashboard/crm", icon: Users },
  { name: "Clients", href: "/dashboard/customers", icon: Users },
  { name: "Produits", href: "/dashboard/products", icon: ShoppingBag },
  { name: "Commandes", href: "/dashboard/orders", icon: Package },
  { name: "Tickets", href: "/dashboard/tickets", icon: KanbanSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Automation", href: "/dashboard/automation", icon: Workflow },
  { name: "IA", href: "#", icon: Bot },
  { name: "Insights", href: "/dashboard/insights", icon: Sparkles },
  { name: "Facturation", href: "/dashboard/billing", icon: CreditCard },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
      <div className="flex h-20 shrink-0 items-center border-b border-[var(--border)] px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            POLYRAAGA
          </h1>
          <p className="text-xs text-[var(--text-tertiary)]">
            Business Operating System
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-4 mt-0 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          Polyraaga AI
        </div>
        <p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">
          Votre assistant intelligent analyse les conversations, suggère des réponses et optimise vos ventes.
        </p>
        <button className="mt-3 w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]">
          Ouvrir l&apos;IA
        </button>
      </div>
    </aside>
  );
}