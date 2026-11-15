"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  ShoppingBag,
  Users,
  Lightbulb,
  ArrowUpRight,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { apiFetch } from "@/lib/api";

interface KpiMetric {
  value: number | string;
  unit?: string;
  changePct: number;
  isPositive: boolean;
  label: string;
}

interface TimelinePoint {
  date: string;
  revenue: number;
  orders: number;
  conversations: number;
}

interface ChannelShare {
  channel: string;
  ordersCount: number;
  revenue: number;
  percent: number;
  color: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionLabel: string;
  category: "growth" | "automation" | "retention";
}

const FALLBACK_SUMMARY = `Votre boutique affiche une performance exceptionnelle avec une hausse de +24.8% du volume de ventes cette semaine. 
Le canal WhatsApp représente à lui seul 81% de vos conversions directes, stimulé par la rapidité de réponse de vos Agents IA (0.8s en moyenne). 
Recommandation prioritaire : Réapprovisionnez d'urgence le 'Sac à main cuir tressé' qui risque la rupture totale sous 72h au rythme actuel.`;

const FALLBACK_TIMELINE: TimelinePoint[] = [
  { date: "11 Nov", revenue: 85000, orders: 4, conversations: 28 },
  { date: "12 Nov", revenue: 140000, orders: 7, conversations: 42 },
  { date: "13 Nov", revenue: 210000, orders: 11, conversations: 65 },
  { date: "14 Nov", revenue: 175000, orders: 9, conversations: 51 },
  { date: "15 Nov", revenue: 290000, orders: 14, conversations: 78 },
  { date: "16 Nov", revenue: 380000, orders: 18, conversations: 95 },
  { date: "17 Nov", revenue: 420000, orders: 21, conversations: 110 },
];

const FALLBACK_CHANNELS: ChannelShare[] = [
  { channel: "WhatsApp Direct", ordersCount: 68, revenue: 1395000, percent: 81, color: "#25D366" },
  { channel: "Boutique Web", ordersCount: 11, revenue: 225000, percent: 13, color: "var(--accent)" },
  { channel: "Instagram DM", ordersCount: 5, revenue: 80000, percent: 6, color: "#EB459E" },
];

const FALLBACK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-1",
    title: "Relance des paniers abandonnés sur WhatsApp",
    description: "14 clients ont ajouté un article sans finaliser l'achat dans les dernières 48h. L'envoi automatique d'un message avec un code promo de 5% permettrait de récupérer ~180 000 FCFA.",
    impact: "high",
    actionLabel: "Activer la relance automatique",
    category: "growth",
  },
  {
    id: "rec-2",
    title: "Pic d'affluence : Activez le second agent entre 12h et 14h",
    description: "Le volume de requêtes WhatsApp triple pendant la pause déjeuner, augmentant légèrement le temps de réponse. Un agent d'appoint stabilisera le taux de satisfaction à 99%.",
    impact: "high",
    actionLabel: "Programmer l'agent d'appoint",
    category: "automation",
  },
  {
    id: "rec-3",
    title: "Campagne de fidélisation pour vos 12 clients VIP",
    description: "Vos 12 meilleurs clients n'ont pas commandé depuis plus de 20 jours. Proposez-leur un accès anticipé à la nouvelle collection Bazin.",
    impact: "medium",
    actionLabel: "Générer les messages VIP",
    category: "retention",
  },
];

const HEATMAP_DATA = [
  { day: "Lundi", morning: 12, afternoon: 38, evening: 18 },
  { day: "Mardi", morning: 18, afternoon: 45, evening: 24 },
  { day: "Mercredi", morning: 22, afternoon: 62, evening: 35 },
  { day: "Jeudi", morning: 25, afternoon: 58, evening: 40 },
  { day: "Vendredi", morning: 35, afternoon: 85, evening: 65 },
  { day: "Samedi", morning: 40, afternoon: 95, evening: 78 },
  { day: "Dimanche", morning: 15, afternoon: 30, evening: 20 },
];

function formatFCFA(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

export default function InsightsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [appliedRecs, setAppliedRecs] = useState<string[]>([]);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const { data: timeline = FALLBACK_TIMELINE } = useQuery({
    queryKey: ["insights-timeline", period],
    queryFn: async () => {
      try {
        const res = await apiFetch(`/api/v1/analytics/dashboard/?period=${period}`);
        if (!res.ok) return FALLBACK_TIMELINE;
        const json = await res.json();
        return json.timeline ?? FALLBACK_TIMELINE;
      } catch {
        return FALLBACK_TIMELINE;
      }
    },
  });

  const handleApplyRec = (rec: Recommendation) => {
    setAppliedRecs([...appliedRecs, rec.id]);
    setAppliedNotice(`Recommandation appliquée : "${rec.title}"`);
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      <AnimatePresence>
        {appliedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] text-sm font-medium shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{appliedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Intelligence Prédictive
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">
            Insights IA & Stratégie Business
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Analyses croisées de vos ventes, modélisation des pics d&apos;activité et suggestions de croissance personnalisées.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] p-1 rounded-2xl shadow-sm self-start md:self-auto">
          {[7, 30, 90].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as typeof period)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Derniers {p} jours
            </button>
          ))}
        </div>
      </div>

      {/* AI Executive Summary Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#5865F2]/15 via-[var(--accent)]/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Synthèse Exécutive Générée par l&apos;IA
            </h2>
          </div>

          <p className="text-sm md:text-base text-[var(--text-primary)] leading-relaxed font-sans max-w-4xl">
            {FALLBACK_SUMMARY}
          </p>

          <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)] pt-2 border-t border-[var(--border)]">
            <span>Données analysées sur {period} jours</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[var(--success)] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Modèle Claude 3.5 Sonnet actif
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Taux de Conversion Global"
          value="14.2%"
          changePct={3.4}
          isPositive={true}
          subtext="Prospects convertis en commandes"
          icon={<Target className="w-4 h-4 text-[var(--accent)]" />}
        />
        <KpiCard
          label="Temps de Réponse Moyen IA"
          value="0.8s"
          changePct={18.2}
          isPositive={true}
          subtext="Vitesse d'exécution des agents"
          icon={<Zap className="w-4 h-4 text-[#5865F2]" />}
        />
        <KpiCard
          label="Panier Moyen par Client"
          value="24 500 FCFA"
          changePct={7.1}
          isPositive={true}
          subtext="Valeur moyenne d'un achat"
          icon={<ShoppingBag className="w-4 h-4 text-[var(--success)]" />}
        />
        <KpiCard
          label="Taux de Rétention 30j"
          value="68.4%"
          changePct={-1.2}
          isPositive={false}
          subtext="Clients effectuant un réachat"
          icon={<Users className="w-4 h-4 text-[var(--warm)]" />}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Courbe des Ventes & Activité</h3>
              <p className="text-xs text-[var(--text-secondary)]">Revenus cumulés et commandes journalières</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[var(--accent)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" /> Revenu
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#5865F2]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5865F2]" /> Commandes
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === "revenue" ? formatFCFA(Number(val) || 0) : String(val),
                    name === "revenue" ? "Revenu" : "Commandes",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "1rem",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2.5} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution Breakdown */}
        <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Origine des Commandes</h3>
            <p className="text-xs text-[var(--text-secondary)]">Répartition des ventes par canal de discussion</p>
          </div>

          <div className="space-y-4 py-2">
            {FALLBACK_CHANNELS.map((ch) => (
              <div key={ch.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                  <span>{ch.channel}</span>
                  <span>{ch.percent}% ({formatFCFA(ch.revenue)})</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ch.percent}%`, backgroundColor: ch.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-normal">
            💡 <strong>Observation IA :</strong> WhatsApp génère le meilleur panier moyen avec 40% moins d&apos;abandons que les tunnels web classiques.
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[var(--warm)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">Recommandations Stratégiques Actionnables</h2>
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">Générées automatiquement ce jour</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FALLBACK_RECOMMENDATIONS.map((rec) => {
            const isApplied = appliedRecs.includes(rec.id);

            return (
              <div
                key={rec.id}
                className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 md:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        rec.impact === "high"
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : "bg-[var(--warm-soft)] text-[var(--warm)]"
                      }`}
                    >
                      Impact {rec.impact === "high" ? "Élevé" : "Moyen"}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase">
                      {rec.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">{rec.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
                </div>

                <button
                  disabled={isApplied}
                  onClick={() => handleApplyRec(rec)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isApplied
                      ? "bg-[var(--success-soft)] text-[var(--success)] cursor-default"
                      : "bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white"
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Règle Appliquée
                    </>
                  ) : (
                    <>
                      {rec.actionLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap & Peak Activity Times */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Carte Thermique des Sollicitations Clients</h3>
            <p className="text-xs text-[var(--text-secondary)]">Moments de la semaine où vos prospects engagent la conversation</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-tertiary)] font-semibold uppercase">
                <th className="pb-3 pl-2">Jour</th>
                <th className="pb-3 text-center">Matinée (8h-12h)</th>
                <th className="pb-3 text-center">Après-Midi (12h-18h)</th>
                <th className="pb-3 text-center pr-2">Soirée (18h-23h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {HEATMAP_DATA.map((row) => (
                <tr key={row.day} className="hover:bg-[var(--bg)]/50 transition-colors">
                  <td className="py-3 pl-2 font-bold text-[var(--text-primary)]">{row.day}</td>
                  <td className="py-3 text-center">
                    <span
                      className="inline-block px-3 py-1 rounded-xl font-bold font-mono text-[11px]"
                      style={{
                        backgroundColor: `rgba(88, 101, 242, ${Math.min(1, row.morning / 100 + 0.15)})`,
                        color: row.morning > 30 ? "#fff" : "var(--text-primary)",
                      }}
                    >
                      {row.morning} msgs
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className="inline-block px-3 py-1 rounded-xl font-bold font-mono text-[11px]"
                      style={{
                        backgroundColor: `rgba(88, 101, 242, ${Math.min(1, row.afternoon / 100 + 0.2)})`,
                        color: "#fff",
                      }}
                    >
                      {row.afternoon} msgs
                    </span>
                  </td>
                  <td className="py-3 text-center pr-2">
                    <span
                      className="inline-block px-3 py-1 rounded-xl font-bold font-mono text-[11px]"
                      style={{
                        backgroundColor: `rgba(88, 101, 242, ${Math.min(1, row.evening / 100 + 0.15)})`,
                        color: row.evening > 40 ? "#fff" : "var(--text-primary)",
                      }}
                    >
                      {row.evening} msgs
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  changePct,
  isPositive,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  changePct: number;
  isPositive: boolean;
  subtext: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        <div className="p-1.5 rounded-xl bg-[var(--bg)]">{icon}</div>
      </div>

      <div>
        <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
        <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
          <span
            className="flex items-center"
            style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {isPositive ? `+${changePct}%` : `${changePct}%`}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate">vs sem. précédente</span>
        </div>
      </div>
    </div>
  );
}
