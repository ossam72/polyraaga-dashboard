"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, TrendingUp, Users, Star, Phone, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface Customer {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  is_verified: boolean;
  date_joined: string;
  orders_count: number;
  total_spent: number | null;
  last_order_date: string | null;
  tags: Tag[];
  score: number;
}

function scoreStyle(score: number) {
  if (score >= 60) return { bg: "var(--success-soft)", text: "var(--success)" };
  if (score >= 30) return { bg: "var(--warm-soft)", text: "var(--warm)" };
  return { bg: "var(--border)", text: "var(--text-tertiary)" };
}

function displayName(c: Customer) {
  const full = `${c.first_name} ${c.last_name}`.trim();
  return full || c.username;
}

function initials(c: Customer) {
  const name = displayName(c);
  return name.slice(0, 2).toUpperCase();
}

function formatFCFA(amount: number | null) {
  if (!amount) return "0 FCFA";
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

async function fetchCustomers(): Promise<Customer[]> {
  const res = await apiFetch("/api/v1/crm/customers/");
  if (!res.ok) throw new Error("Erreur lors du chargement des clients");
  const data = await res.json();
  return data.results ?? data; // supporte l'ancien format (tableau brut) sans casser
}

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: customers, isLoading, isError } = useQuery({
    queryKey: ["crm-customers"],
    queryFn: fetchCustomers,
  });

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        displayName(c).toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    if (!customers) return { total: 0, avgScore: 0, totalRevenue: 0 };
    const total = customers.length;
    const avgScore = total
      ? Math.round(customers.reduce((s, c) => s + c.score, 0) / total)
      : 0;
    const totalRevenue = customers.reduce((s, c) => s + (c.total_spent || 0), 0);
    return { total, avgScore, totalRevenue };
  }, [customers]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Clients</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Vue d&apos;ensemble et scoring de votre base client
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Clients"
          value={stats.total.toString()}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Score moyen"
          value={`${stats.avgScore}/100`}
        />
        <StatCard
          icon={<Star className="w-4 h-4" />}
          label="Revenu cumulé"
          value={formatFCFA(stats.totalRevenue)}
        />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone, ville..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-lg
                     bg-[var(--surface)] text-[var(--text-primary)]
                     focus:outline-none focus:ring-2 focus:border-[var(--accent)]
                     placeholder:text-[var(--text-tertiary)] transition"
          style={{ "--tw-ring-color": "var(--accent-soft)" } as React.CSSProperties}
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">
          Chargement des clients...
        </div>
      )}

      {isError && (
        <div className="py-16 text-center text-sm" style={{ color: "var(--danger)" }}>
          Impossible de charger les clients. Vérifie que le serveur Django tourne.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">
          Aucun client trouvé.
        </div>
      )}

      {/* Customer list */}
      <div className="space-y-2">
        {filtered.map((c, i) => {
          const s = scoreStyle(c.score);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              onClick={() => router.push(`/dashboard/crm/${c.id}`)}
              className="flex items-center justify-between gap-4 px-5 py-4
                         bg-[var(--surface)] border border-[var(--border)] rounded-xl
                         hover:border-[var(--accent)] hover:shadow-sm transition cursor-pointer"
            >
              {/* Left: identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full text-white text-xs
                             font-medium flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {initials(c)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {displayName(c)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </span>
                    )}
                    {c.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {c.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: tags */}
              <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center">
                {c.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: `${tag.color}15`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* Right: stats + score */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {formatFCFA(c.total_spent)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {c.orders_count} commande{c.orders_count > 1 ? "s" : ""}
                  </p>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: s.bg, color: s.text }}
                >
                  {c.score}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}