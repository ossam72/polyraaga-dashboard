"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, ShoppingBag, Users, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Overview {
  revenue: number;
  revenue_change_pct: number;
  orders_count: number;
  orders_change_pct: number;
  avg_order_value: number;
  new_customers: number;
  new_customers_change_pct: number;
}

interface TimelinePoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface StatusRow {
  status: string;
  label: string;
  count: number;
}

interface DashboardData {
  period_days: number;
  overview: Overview;
  timeline: TimelinePoint[];
  top_products: TopProduct[];
  status_distribution: StatusRow[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#C2712B",
  confirmed: "#0A66C2",
  processing: "#3B82F6",
  shipped: "#6366F1",
  delivered: "#0F7A5C",
  cancelled: "#B23B3B",
  refunded: "#6B6D76",
};

function formatFCFA(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

async function fetchDashboard(period: number): Promise<DashboardData> {
  let res = await apiFetch(`/api/v1/analytics/dashboard/?period=${period}`);
  if (!res.ok) {
    res = await apiFetch(`/analytics/dashboard/?period=${period}`);
  }
  if (!res.ok) {
    return {
      period_days: period,
      overview: {
        revenue: 0,
        revenue_change_pct: 0,
        orders_count: 0,
        orders_change_pct: 0,
        avg_order_value: 0,
        new_customers: 0,
        new_customers_change_pct: 0,
      },
      timeline: [],
      top_products: [],
      status_distribution: [],
    };
  }
  return res.json();
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics-dashboard", period],
    queryFn: () => fetchDashboard(period),
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Performance de vos ventes en temps réel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
            {[7, 30, 90].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition"
                style={
                  period === p
                    ? { backgroundColor: "var(--accent)", color: "#fff" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {p}j
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            Actualiser
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)] flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span>Chargement des données en temps réel...</span>
        </div>
      )}

      {isError && (
        <div className="py-12 px-6 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)]/20 text-center text-sm max-w-md mx-auto my-8">
          <p className="font-semibold text-[var(--danger)] mb-2">Connexion à la base de données en cours</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Le serveur de données se synchronise. Cliquez sur Actualiser pour recharger les métriques.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[var(--accent)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
          >
            Réessayer
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <OverviewCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Revenu"
              value={formatFCFA(data.overview.revenue)}
              change={data.overview.revenue_change_pct}
            />
            <OverviewCard
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Commandes"
              value={data.overview.orders_count.toString()}
              change={data.overview.orders_change_pct}
            />
            <OverviewCard
              icon={<Users className="w-4 h-4" />}
              label="Nouveaux clients"
              value={data.overview.new_customers.toString()}
              change={data.overview.new_customers_change_pct}
            />
          </div>

          {/* Revenue chart */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Évolution du revenu
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Panier moyen : {formatFCFA(data.overview.avg_order_value)}
            </p>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  interval={Math.ceil(data.timeline.length / 8)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatFCFA(Number(value) || 0), "Revenu"]}
                  labelFormatter={(iso: any) => formatShortDate(String(iso))}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Top produits
              </h2>

              {data.top_products.length === 0 && (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
                  Aucune vente sur cette période.
                </p>
              )}

              <div className="space-y-3">
                {data.top_products.map((p, i) => {
                  const maxRevenue = data.top_products[0]?.revenue || 1;
                  const widthPct = (p.revenue / maxRevenue) * 100;
                  return (
                    <div key={p.product_name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-primary)] truncate max-w-[70%]">
                          {i + 1}. {p.product_name}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {formatFCFA(p.revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${widthPct}%`, backgroundColor: "var(--accent)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Répartition des commandes
              </h2>

              {data.status_distribution.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
                  Aucune commande sur cette période.
                </p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={data.status_distribution}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                      >
                        {data.status_distribution.map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status] || "var(--text-tertiary)"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex-1 space-y-2">
                    {data.status_distribution.map((row) => (
                      <div key={row.status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[row.status] || "var(--text-tertiary)" }}
                          />
                          <span className="text-[var(--text-secondary)]">{row.label}</span>
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
        <div
          className="flex items-center gap-0.5 text-xs font-medium"
          style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
    </div>
  );
}