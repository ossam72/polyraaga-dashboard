"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  LogOut,
  Hash,
  Compass,
} from "lucide-react";
import clsx from "clsx";
import { useCopilot } from "@/context/CopilotContext";
import { getUser, logout } from "@/lib/auth";

const channels = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox WhatsApp", href: "/dashboard/chat", icon: MessageSquare },
  { name: "CRM Prospects", href: "/dashboard/crm", icon: Users },
  { name: "Clients", href: "/dashboard/customers", icon: Users },
  { name: "Produits", href: "/dashboard/products", icon: ShoppingBag },
  { name: "Commandes", href: "/dashboard/orders", icon: Package },
  { name: "Tickets Support", href: "/dashboard/tickets", icon: KanbanSquare },
  { name: "Analytics Ventes", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Automations", href: "/dashboard/automation", icon: Workflow },
  { name: "Agents IA", href: "/dashboard/agents", icon: Bot },
  { name: "Insights Stratégiques", href: "/dashboard/insights", icon: Sparkles },
  { name: "Facturation & Plans", href: "/dashboard/billing", icon: CreditCard },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { openCopilot } = useCopilot();
  const [user, setUser] = useState<{ username?: string; first_name?: string; last_name?: string; email?: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setUser(u);
    }
  }, []);

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : (user?.username || "Ossam Bangre");
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] select-none">
      {/* Brand Header with Scrafit Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4 bg-[var(--sidebar-bg)] hover:bg-[var(--surface)]/40 transition">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[var(--border)] flex items-center justify-center">
            {/* Scrafit Mascot Logo */}
            <img
              src="/scrafit-logo.jpg"
              alt="Scrafit Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                // Fallback to bot icon if image fails
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              <span>Scrafit</span>
              <span className="rounded bg-[var(--accent)] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                PRO
              </span>
            </h1>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
              E-commerce & IA
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Channels (Discord channel list aesthetic) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
          Salons & Modules
        </div>

        {channels.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                active
                  ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/60 hover:text-[var(--text-primary)]"
              )}
            >
              {/* Discord-style left indicator pill */}
              <span
                className={clsx(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-[var(--accent)] transition-all duration-200",
                  active ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-2 group-hover:opacity-60"
                )}
              />

              <Icon
                size={16}
                className={clsx(
                  "shrink-0 transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* AI Copilot Promo Card with Live Trigger */}
      <div className="mx-2 mb-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--accent)]" />
            <span>Scrafit Copilot</span>
          </div>
          <span className="rounded-full bg-[var(--success-soft)] px-1.5 py-0.2 text-[9px] font-bold text-[var(--success)]">
            Actif
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
          Votre assistant commercial pour closer des ventes et générer des paiements.
        </p>
        <button
          onClick={openCopilot}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)] shadow-sm cursor-pointer"
        >
          <Bot size={14} />
          <span>Ouvrir l&apos;IA</span>
        </button>
      </div>

      {/* Discord User Profile Bar at Bottom */}
      <div className="flex h-14 shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white shadow-sm">
            {initials}
            {/* Discord active status green circle */}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[#23A55A]" />
          </div>
          <div className="truncate">
            <div className="truncate text-xs font-bold text-[var(--text-primary)]">
              {displayName}
            </div>
            <div className="truncate text-[10px] text-[var(--text-tertiary)]">
              En ligne • #0001
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/settings"
            title="Paramètres"
            className="rounded p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--sidebar-bg)] hover:text-[var(--text-primary)] transition"
          >
            <Settings size={15} />
          </Link>
          <button
            onClick={() => logout()}
            title="Se déconnecter"
            className="rounded p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
