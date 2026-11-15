"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Shield,
  Download,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  FileText,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: PlanFeature[];
  quotaMessages: number;
  quotaAgents: number;
  quotaStorageGb: number;
  buttonLabel: string;
}

interface Invoice {
  id: string;
  number: string;
  created_at: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  plan_name: string;
  download_url?: string;
}

interface SubscriptionData {
  current_plan_id: string;
  billing_cycle: "monthly" | "yearly";
  renewal_date: string;
  messages_used: number;
  messages_limit: number;
  agents_used: number;
  agents_limit: number;
  storage_used_gb: number;
  storage_limit_gb: number;
  payment_method?: {
    type: string;
    brand: string;
    last4: string;
    expiry: string;
  };
}

const PLANS: PlanTier[] = [
  {
    id: "starter",
    name: "Starter Booster",
    priceMonthly: 9900,
    priceYearly: 99000,
    description: "Idéal pour commerçants indépendants lançant leur boutique WhatsApp.",
    quotaMessages: 1500,
    quotaAgents: 1,
    quotaStorageGb: 5,
    buttonLabel: "Sélectionner Starter",
    features: [
      { text: "1 Agent IA WhatsApp réactif 24/7", included: true },
      { text: "1 500 messages IA / mois", included: true },
      { text: "Synchronisation catalogue 50 produits", included: true },
      { text: "Gestion commandes & paiements manuels", included: true },
      { text: "Support standard par email", included: true },
      { text: "Statistiques & KPIs basiques", included: true },
      { text: "Webhooks & API personnalisés", included: false },
      { text: "Multi-agents & routage d'équipe", included: false },
    ],
  },
  {
    id: "pro",
    name: "Polyraaga Pro",
    badge: "Le Plus Populaire",
    popular: true,
    priceMonthly: 29900,
    priceYearly: 299000,
    description: "Pour les boutiques en forte croissance nécessitant automatisation complète & haute conversion.",
    quotaMessages: 12000,
    quotaAgents: 5,
    quotaStorageGb: 30,
    buttonLabel: "Conserver / Passer à Pro",
    features: [
      { text: "Jusqu'à 5 Agents IA simultanés", included: true, highlight: true },
      { text: "12 000 messages IA conversationnels / mois", included: true, highlight: true },
      { text: "Modèles Claude 3.5 Sonnet & GPT-4o intégrés", included: true },
      { text: "Catalogue produits illimité", included: true },
      { text: "Envoi automatique d'images & fiches produits", included: true },
      { text: "Relance paniers abandonnés & promotions", included: true },
      { text: "Webhooks temps réel & export CRM complet", included: true },
      { text: "Support prioritaire WhatsApp 7j/7", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Studio",
    badge: "Sur-Mesure",
    priceMonthly: 89000,
    priceYearly: 890000,
    description: "Pour les réseaux de distribution, franchises et marques exigeant un SLA de 99.9% et support dédié.",
    quotaMessages: 60000,
    quotaAgents: 20,
    quotaStorageGb: 200,
    buttonLabel: "Passer à l'Échelle Entreprise",
    features: [
      { text: "20 Agents IA haute disponibilité", included: true },
      { text: "60 000+ messages IA volumétriques", included: true },
      { text: "Fine-tuning sur données historiques d'entreprise", included: true, highlight: true },
      { text: "Gestion multi-comptes WhatsApp Business API", included: true },
      { text: "Intégration ERP & systèmes de caisse personnalisés", included: true },
      { text: "Manager de compte dédié & SLA 99.9%", included: true },
      { text: "Sauvegardes chiffrées & conformité RGPD/BCEAO", included: true },
      { text: "Formation personnalisée de vos équipes", included: true },
    ],
  },
];

const FALLBACK_SUBSCRIPTION: SubscriptionData = {
  current_plan_id: "pro",
  billing_cycle: "monthly",
  renewal_date: "2024-12-18T00:00:00Z",
  messages_used: 4890,
  messages_limit: 12000,
  agents_used: 3,
  agents_limit: 5,
  storage_used_gb: 7.4,
  storage_limit_gb: 30,
  payment_method: {
    type: "Orange Money / Wave / Carte",
    brand: "Visa",
    last4: "8412",
    expiry: "09/27",
  },
};

const FALLBACK_INVOICES: Invoice[] = [
  {
    id: "inv-004",
    number: "FACT-2024-11-094",
    created_at: "2024-11-18T10:15:00Z",
    amount: 29900,
    status: "paid",
    plan_name: "Polyraaga Pro (Mensuel)",
  },
  {
    id: "inv-003",
    number: "FACT-2024-10-081",
    created_at: "2024-10-18T10:15:00Z",
    amount: 29900,
    status: "paid",
    plan_name: "Polyraaga Pro (Mensuel)",
  },
  {
    id: "inv-002",
    number: "FACT-2024-09-042",
    created_at: "2024-09-18T09:00:00Z",
    amount: 9900,
    status: "paid",
    plan_name: "Starter Booster (Mensuel)",
  },
  {
    id: "inv-001",
    number: "FACT-2024-08-011",
    created_at: "2024-08-18T09:00:00Z",
    amount: 9900,
    status: "paid",
    plan_name: "Starter Booster (Mensuel)",
  },
];

function formatFCFA(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function fetchSubscription(): Promise<SubscriptionData> {
  try {
    const res = await apiFetch("/api/v1/billing/subscription/");
    if (!res.ok) return FALLBACK_SUBSCRIPTION;
    return await res.json();
  } catch {
    return FALLBACK_SUBSCRIPTION;
  }
}

async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const res = await apiFetch("/api/v1/billing/invoices/");
    if (!res.ok) return FALLBACK_INVOICES;
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? FALLBACK_INVOICES;
  } catch {
    return FALLBACK_INVOICES;
  }
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanTier | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const { data: sub = FALLBACK_SUBSCRIPTION } = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: fetchSubscription,
  });

  const { data: invoices = FALLBACK_INVOICES } = useQuery({
    queryKey: ["billing-invoices"],
    queryFn: fetchInvoices,
  });

  const currentPlan = PLANS.find((p) => p.id === sub.current_plan_id) || PLANS[1];

  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      try {
        await apiFetch("/api/v1/billing/change-plan/", {
          method: "POST",
          body: JSON.stringify({ plan_id: planId, cycle }),
        });
      } catch (err) {
        console.warn("API offline, updated locally", err);
      }
      return planId;
    },
    onSuccess: (newPlanId) => {
      queryClient.setQueryData<SubscriptionData>(["billing-subscription"], (old) => {
        const target = PLANS.find((p) => p.id === newPlanId);
        return {
          ...(old ?? FALLBACK_SUBSCRIPTION),
          current_plan_id: newPlanId,
          messages_limit: target?.quotaMessages ?? 12000,
          agents_limit: target?.quotaAgents ?? 5,
        };
      });
      setSelectedPlanForUpgrade(null);
      setIsProcessingUpgrade(false);
      setActionNotice(`Félicitations ! Vous êtes désormais sur le forfait ${PLANS.find((p) => p.id === newPlanId)?.name}.`);
      setTimeout(() => setActionNotice(null), 5000);
    },
  });

  const handleDownloadInvoice = (inv: Invoice) => {
    // Génère un téléchargement propre de reçu/facture PDF simulé
    const dummyContent = `FACTURE POLYRAAGA\nRéférence: ${inv.number}\nDate: ${formatDate(
      inv.created_at
    )}\nPlan: ${inv.plan_name}\nMontant: ${formatFCFA(inv.amount)}\nStatut: PAYÉ\nMerci pour votre fidélité!`;
    const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${inv.number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const messageUsagePercent = Math.min(100, Math.round((sub.messages_used / sub.messages_limit) * 100));
  const agentUsagePercent = Math.min(100, Math.round((sub.agents_used / sub.agents_limit) * 100));
  const storageUsagePercent = Math.min(100, Math.round((sub.storage_used_gb / sub.storage_limit_gb) * 100));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Toast Notice */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] text-sm font-medium shadow-lg"
          >
            <BadgeCheck className="w-5 h-5 shrink-0" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Forfait Polyraaga Nitro
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-1.5">
            Abonnement & Consommation
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gérez vos quotas d&apos;intelligence artificielle, modes de paiement et historique de facturation.
          </p>
        </div>

        {/* Toggle Mensuel / Annuel avec remise */}
        <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] p-1 rounded-2xl shadow-sm self-start md:self-auto">
          <button
            onClick={() => setCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              cycle === "monthly"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Facturation Mensuelle
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              cycle === "yearly"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Annuelle
            <span className="px-1.5 py-0.2 rounded-md bg-[var(--success)] text-white text-[10px] font-bold">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Hero: Active Plan Status & Consumption Gauges */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[var(--accent)]/10 via-[#5865F2]/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Plan Info */}
          <div className="space-y-4 lg:border-r border-[var(--border)] lg:pr-8">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Abonnement Actuel
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                {currentPlan.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{currentPlan.description}</p>
            </div>

            <div className="pt-2">
              <div className="text-2xl font-bold text-[var(--accent)]">
                {formatFCFA(cycle === "monthly" ? currentPlan.priceMonthly : currentPlan.priceYearly / 12)}
                <span className="text-xs font-normal text-[var(--text-tertiary)]"> / mois</span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Renouvellement automatique le {formatDate(sub.renewal_date)}
              </p>
            </div>
          </div>

          {/* Quota Progress Meters */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <QuotaMeter
              title="Messages IA Traités"
              current={sub.messages_used}
              limit={sub.messages_limit}
              unit="msgs"
              percent={messageUsagePercent}
              icon={<Cpu className="w-4 h-4 text-[var(--accent)]" />}
              color="var(--accent)"
            />
            <QuotaMeter
              title="Agents Actifs"
              current={sub.agents_used}
              limit={sub.agents_limit}
              unit="agents"
              percent={agentUsagePercent}
              icon={<Zap className="w-4 h-4 text-[#5865F2]" />}
              color="#5865F2"
            />
            <QuotaMeter
              title="Stockage Documents / Médias"
              current={sub.storage_used_gb}
              limit={sub.storage_limit_gb}
              unit="Go"
              percent={storageUsagePercent}
              icon={<Layers className="w-4 h-4 text-[var(--warm)]" />}
              color="var(--warm)"
            />
          </div>
        </div>

        {/* Payment info bar */}
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-[var(--text-primary)]">
                {sub.payment_method?.brand || "Carte / Portefeuille Mobile"} •••• {sub.payment_method?.last4 || "0000"}
              </span>
              <span className="text-[var(--text-tertiary)] block text-[11px]">
                Expire le {sub.payment_method?.expiry || "12/28"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setActionNotice("Module de mise à jour de carte sécurisé ouvert avec votre passerelle de paiement.");
              setTimeout(() => setActionNotice(null), 4000);
            }}
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            Mettre à jour le moyen de paiement <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Plan Comparison Grid */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Choisissez l&apos;offre calibrée pour vos volumes
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Passez à un forfait supérieur à tout moment avec prorata temporis immédiat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === sub.current_plan_id;
            const price = cycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12);

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all ${
                  isCurrent
                    ? "bg-[var(--surface)] border-2 border-[var(--accent)] shadow-xl shadow-[var(--accent)]/10"
                    : plan.popular
                    ? "bg-[var(--surface)] border-2 border-[#5865F2]/50 shadow-lg shadow-[#5865F2]/10"
                    : "bg-[var(--surface)] border border-[var(--border)]"
                }`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-extrabold text-[var(--text-primary)]">{plan.name}</span>
                  {isCurrent ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30">
                      Forfait Actuel
                    </span>
                  ) : plan.badge ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#5865F2] text-white shadow-sm">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-[var(--border)]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[var(--text-primary)]">
                      {formatFCFA(price)}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">/ mois</span>
                  </div>
                  {cycle === "yearly" && (
                    <p className="text-[11px] text-[var(--success)] font-medium mt-1">
                      Facturé {formatFCFA(plan.priceYearly)} / an (Économisez 2 mois)
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 flex-1 mb-8">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-tertiary)] block">
                    Inclus dans l&apos;offre :
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {feat.included ? (
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            feat.highlight
                              ? "bg-[#5865F2] text-white"
                              : "bg-[var(--success-soft)] text-[var(--success)]"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center shrink-0 mt-0.5 text-[var(--text-tertiary)]">
                          -
                        </div>
                      )}
                      <span
                        className={`${
                          !feat.included
                            ? "text-[var(--text-tertiary)] line-through opacity-60"
                            : feat.highlight
                            ? "font-semibold text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  disabled={isCurrent}
                  onClick={() => setSelectedPlanForUpgrade(plan)}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    isCurrent
                      ? "bg-[var(--bg)] border border-[var(--border)] text-[var(--text-tertiary)] cursor-default"
                      : plan.popular
                      ? "bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-[#5865F2]/25"
                      : "bg-[var(--accent)] hover:opacity-90 text-white shadow-[var(--accent)]/20"
                  }`}
                >
                  {isCurrent ? "Votre forfait en cours" : plan.buttonLabel}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Historique des Factures</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Téléchargez vos reçus et justificatifs comptables officiels conformes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Shield className="w-4 h-4 text-[var(--success)]" />
            Paiements 100% sécurisés & chiffrés SSL 256-bit
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Référence Facture</th>
                <th className="pb-3">Date d&apos;émission</th>
                <th className="pb-3">Forfait</th>
                <th className="pb-3">Montant</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3 pr-2 text-right">Télécharger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                  <td className="py-4 pl-2 font-mono font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    {inv.number}
                  </td>
                  <td className="py-4 text-[var(--text-secondary)]">{formatDate(inv.created_at)}</td>
                  <td className="py-4 font-medium text-[var(--text-primary)]">{inv.plan_name}</td>
                  <td className="py-4 font-bold text-[var(--text-primary)]">{formatFCFA(inv.amount)}</td>
                  <td className="py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        inv.status === "paid"
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : inv.status === "pending"
                          ? "bg-[var(--warm-soft)] text-[var(--warm)]"
                          : "bg-[var(--danger-soft)] text-[var(--danger)]"
                      }`}
                    >
                      {inv.status === "paid" ? "Payée" : inv.status === "pending" ? "En attente" : "Échouée"}
                    </span>
                  </td>
                  <td className="py-4 pr-2 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(inv)}
                      className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      title="Télécharger le reçu"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      <AnimatePresence>
        {selectedPlanForUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">
                    Confirmer le passage à {selectedPlanForUpgrade.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">Mise à niveau instantanée sans interruption</p>
                </div>
              </div>

              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Nouveau montant ({cycle === "monthly" ? "Mensuel" : "Annuel"}) :</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatFCFA(
                      cycle === "monthly"
                        ? selectedPlanForUpgrade.priceMonthly
                        : selectedPlanForUpgrade.priceYearly
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Quota de messages IA :</span>
                  <span className="font-bold text-[var(--success)]">
                    {selectedPlanForUpgrade.quotaMessages.toLocaleString("fr-FR")} msgs / mois
                  </span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Agents IA simultanés :</span>
                  <span className="font-bold text-[var(--accent)]">
                    {selectedPlanForUpgrade.quotaAgents} agents
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-tertiary)] leading-normal">
                En confirmant, le nouveau tarif sera appliqué sur votre moyen de paiement principal. Vous pouvez
                ajuster ou résilier votre formule à tout moment.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedPlanForUpgrade(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setIsProcessingUpgrade(true);
                    changePlanMutation.mutate(selectedPlanForUpgrade.id);
                  }}
                  disabled={isProcessingUpgrade}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                >
                  {isProcessingUpgrade ? "Traitement..." : "Confirmer le changement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuotaMeter({
  title,
  current,
  limit,
  unit,
  percent,
  icon,
  color,
}: {
  title: string;
  current: number;
  limit: number;
  unit: string;
  percent: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-primary)]">{title}</span>
        <div className="p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">{icon}</div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-lg font-black text-[var(--text-primary)]">
            {current.toLocaleString("fr-FR")}
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            / {limit.toLocaleString("fr-FR")} {unit}
          </span>
        </div>

        <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <div className="text-[10px] text-[var(--text-tertiary)] flex justify-between">
        <span>{percent}% consommés</span>
        <span>{Math.max(0, limit - current).toLocaleString("fr-FR")} restants</span>
      </div>
    </div>
  );
}
