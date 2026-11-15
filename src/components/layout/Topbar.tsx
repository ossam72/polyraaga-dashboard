"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Search, Sparkles, Moon, Sun, ChevronDown } from "lucide-react";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/90 px-8 backdrop-blur-xl">
      <div className="flex w-[420px] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5">
        <Search className="text-[var(--text-tertiary)]" size={18} />
        <input
          placeholder="Rechercher clients, commandes, conversations..."
          className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]">
          <Sparkles size={16} />
          AI Copilot
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)]"
        >
          {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)]">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-medium text-white">
            OB
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Ossam Bangre
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              Founder • Polyraaga
            </div>
          </div>
          <ChevronDown size={16} className="text-[var(--text-tertiary)]" />
        </div>
      </div>
    </header>
  );
}