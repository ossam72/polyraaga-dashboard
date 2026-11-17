"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Bell, Search, Sparkles, Moon, Sun, ChevronDown, Bot } from "lucide-react";
import { useCopilot } from "@/context/CopilotContext";
import { getUser } from "@/lib/auth";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { openCopilot } = useCopilot();
  const [user, setUser] = useState<{ username?: string; first_name?: string; last_name?: string; shop_name?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const u = getUser();
    if (u) {
      setUser(u);
    }
  }, []);

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : (user?.username || "Ossam Bangre");
  const shopOrRole = user?.shop_name || "Scrafit E-commerce";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-6 backdrop-blur-xl">
      {/* Search Input styled like Discord quick-switcher */}
      <div className="flex w-[380px] items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 transition focus-within:border-[var(--accent)]">
        <Search className="text-[var(--text-tertiary)] shrink-0" size={16} />
        <input
          placeholder="Rechercher clients, commandes, produits..."
          className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <kbd className="hidden sm:inline-block rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real Functional AI Copilot Button */}
        <button
          onClick={openCopilot}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--accent-hover)] cursor-pointer"
        >
          <Sparkles size={14} />
          <span>AI Copilot</span>
          <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-bold">
            Live
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
          title="Basculer le thème"
        >
          {mounted && theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
          title="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
        </button>

        {/* User Card */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 hover:bg-[var(--surface)] transition"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--bg)] bg-[#23A55A]" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {displayName}
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] leading-tight">
              {shopOrRole}
            </div>
          </div>
          <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
        </Link>
      </div>
    </header>
  );
}
