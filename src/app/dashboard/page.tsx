"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, Tooltip,
} from "recharts";
import {
  DollarSign, ShoppingBag, Users, MessageCircle,
  ArrowUpRight, TrendingUp, TrendingDown, Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AnalyticsData {
  overview: {
    revenue: number;
    revenue_change_pct: number;
    orders_count: number;
    orders_change_pct: number;
    avg_order_value: number;
    new_customers: number;
    new_customers_change_pct: number;
  };
  timeline: { date: string; revenue: number; orders: number }[];
  top_products: { product_name: string; quantity_sold: number; revenue: number }[];
  status_distribution: { status: string; label: string; count: number }[];
}

interface Session {
  id: number;
  client_name: string;
  client_phone: string;
  status: string;
  last_message_at: string;
  messages: { content: string; message_type: string }[];
}

interface Customer {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  score: number;
}

function formatFCFA(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await apiFetch("/api/v1/analytics/dashboard/?period=7");
  if (!res.ok) throw new Error("Erreur analytics");
  return res.json();
}

async function fetchSessions(): Promise<Session[]> {
  const res = await apiFetch("/api/v1/support/sessions/");
  if (!res.ok) throw new Error("Erreur sessions");
  return res.json();
}

async function fetchTopCustomers(): Promise<Customer[]> {
  const res = await apiFetch("/api/v1/crm/customers/");
  if (!res.ok) throw new Error("Erreur customers");
  const data = await res.json();
  const list: Customer[] = data.results ?? data;
  return [...list].sort((a, b) => b.score - a.score).slice(0, 5);
}

export default function DashboardHomePage() {
  const router = useRouter();

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: fetchAnalytics,
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["dashboard-sessions"],
    queryFn: fetchSessions,
    refetchInterval: 10000,
  });

  const { data: topCustomers } = useQuery({
    queryKey: ["dashboard-top-customers"],
    queryFn: fetchTopCustomers,
  });

  const recentSessions = [...(sessions ?? [])]
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    .slice(0, 5);

  const activeConversations = (sessions ?? []).filter((s) => s.status === "HUMAN_HANDLING").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Bonjour 👋
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Voici ce qui se passe sur Polyraaga cette semaine
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          IA active
        </div>
      </div>

      {/* KPI cards avec sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Revenu (7j)"
          value={analytics ? formatFCFA(analytics.overview.revenue) : "—"}
          change={analytics?.overview.revenue_change_pct}
          loading={loadingAnalytics}
          sparkline={analytics?.timeline}
          dataKey="revenue"
        />
        <KpiCard
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Commandes (7j)"
          value={analytics ? analytics.overview.orders_count.toString() : "—"}
          change={analytics?.overview.orders_change_pct}
          loading={loadingAnalytics}
          sparkline={analytics?.timeline}
          dataKey="orders"
        />
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Nouveaux clients"
          value={analytics ? analytics.overview.new_customers.toString() : "—"}
          change={analytics?.overview.new_customers_change_pct}
          loading={loadingAnalytics}
        />
        <KpiCard
          icon={<MessageCircle className="w-4 h-4" />}
          label="Conversations actives"
          value={loadingSessions ? "—" : activeConversations.toString()}
          loading={loadingSessions}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations récentes */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Conversations récentes
            </h2>
            <button
              onClick={() => router.push("/dashboard/chat")}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition"
              style={{ color: "var(--accent)" }}
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {loadingSessions && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-[var(--bg)] animate-pulse" />
              ))}
            </div>
          )}

          {!loadingSessions && recentSessions.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              Aucune conversation pour le moment.
            </p>
          )}

          <div className="space-y-1">
            {recentSessions.map((s) => {
              const last = s.messages[s.messages.length - 1];
              return (
                <button
                  key={s.id}
                  onClick={() => router.push("/dashboard/chat")}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-[var(--bg)] transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full text-white text-xs font-medium flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {(s.client_name || s.client_phone).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {s.client_name || s.client_phone}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[280px]">
                        {last?.content || "—"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                    {timeAgo(s.last_message_at)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Meilleurs clients
            </h2>
            <button
              onClick={() => router.push("/dashboard/crm")}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition"
              style={{ color: "var(--accent)" }}
            >
              CRM <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {(topCustomers ?? []).map((c, i) => {
              const name = `${c.first_name} ${c.last_name}`.trim() || c.username;
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/dashboard/crm/${c.id}`)}
                  className="w-full flex items-center justify-between gap-2 hover:opacity-70 transition text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-[var(--text-tertiary)] w-4">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[var(--text-primary)] truncate">
                      {name}
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 text-xs font-semibold rounded-full shrink-0"
                    style={{
                      backgroundColor: c.score >= 60 ? "var(--success-soft)" : "var(--warm-soft)",
                      color: c.score >= 60 ? "var(--success)" : "var(--warm)",
                    }}
                  >
                    {c.score}
                  </span>
                </button>
              );
            })}
            {(!topCustomers || topCustomers.length === 0) && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
                Aucun client pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  change,
  loading,
  sparkline,
  dataKey,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  loading?: boolean;
  sparkline?: { date: string; revenue: number; orders: number }[];
  dataKey?: "revenue" | "orders";
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 overflow-hidden relative"
    >
      <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>

      <div className="flex items-end justify-between">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          {loading ? "—" : value}
        </p>
        {change !== undefined && (
          <div
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      {sparkline && dataKey && (
        <div className="h-8 -mx-4 -mb-4 mt-2 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <defs>
                <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="var(--accent)"
                strokeWidth={1.5}
                fill={`url(#spark-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}