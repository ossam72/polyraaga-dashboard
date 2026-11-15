"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Pencil,
  Copy,
  ArrowRight,
  MessageSquare,
  ShoppingBag,
  UserPlus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  X,
  Sparkles,
  ChevronRight,
  Bot,
  Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: "customer.created" | "order.updated" | "product.low_stock" | "cart.abandoned" | "cron.scheduled";
  trigger_label: string;
  condition: string;
  action_type: "auto_reply" | "create_ticket" | "notify_admin" | "apply_tag" | "dispatch_agent";
  action_label: string;
  action_detail: string;
  is_active: boolean;
  executions_count: number;
  success_rate: number;
  last_triggered_at: string | null;
  created_at: string;
}

const FALLBACK_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    name: "Message de Bienvenue WhatsApp Automatique",
    description: "Envoie instantanément un message d'accueil et le menu catalogue à tout nouveau prospect qui écrit pour la première fois.",
    trigger_type: "customer.created",
    trigger_label: "Nouveau Contact WhatsApp",
    condition: "is_first_interaction == true",
    action_type: "auto_reply",
    action_label: "Envoyer Message Interactif",
    action_detail: "👋 Bonjour et bienvenue chez Polyraaga ! Je suis votre conseiller personnel. Souhaitez-vous voir nos nouveautés ou suivre une commande ?",
    is_active: true,
    executions_count: 1420,
    success_rate: 99.4,
    last_triggered_at: "2024-11-18T14:35:00Z",
    created_at: "2024-10-01T08:00:00Z",
  },
  {
    id: "rule-2",
    name: "Notification d'Expédition de Colis",
    description: "Alerte le client sur WhatsApp avec son numéro de suivi dès que la commande passe au statut 'Expédiée'.",
    trigger_type: "order.updated",
    trigger_label: "Statut Commande : Expédiée",
    condition: "order.status == 'shipped'",
    action_type: "auto_reply",
    action_label: "Alerte Expédition avec Suivi",
    action_detail: "📦 Votre colis Polyraaga #{order.reference} est en route ! Le livreur vous contactera sous 24h au numéro de livraison.",
    is_active: true,
    executions_count: 532,
    success_rate: 98.8,
    last_triggered_at: "2024-11-18T11:10:00Z",
    created_at: "2024-10-10T12:00:00Z",
  },
  {
    id: "rule-3",
    name: "Alerte Urgente Stock Faible pour le Gérant",
    description: "Déclenche une notification d'alerte et ouvre un ticket de réapprovisionnement automatique lorsque le stock tombe sous 5 unités.",
    trigger_type: "product.low_stock",
    trigger_label: "Stock Produit < 5 unités",
    condition: "product.stock <= 5",
    action_type: "create_ticket",
    action_label: "Créer Ticket Réapprovisionnement",
    action_detail: "Priorité Haute : Le produit {product.name} (SKU: {product.sku}) ne dispose plus que de {product.stock} exemplaires.",
    is_active: true,
    executions_count: 89,
    success_rate: 100,
    last_triggered_at: "2024-11-17T16:45:00Z",
    created_at: "2024-10-15T09:00:00Z",
  },
  {
    id: "rule-4",
    name: "Relance Panier Inachevé (2h après)",
    description: "Propose un code promo exclusif de 5% pour encourager les clients ayant ajouté des articles sans finaliser leur paiement.",
    trigger_type: "cart.abandoned",
    trigger_label: "Panier Inactif > 2h",
    condition: "cart.items_count > 0 && cart.idle_hours >= 2",
    action_type: "auto_reply",
    action_label: "Envoi Code Réduction Personnalisé",
    action_detail: "✨ Vous avez oublié votre sélection ? Bénéficiez d'une remise exclusive de 5% avec le code WELCOME5 valable aujourd'hui !",
    is_active: false,
    executions_count: 245,
    success_rate: 92.0,
    last_triggered_at: "2024-11-15T19:20:00Z",
    created_at: "2024-10-25T14:00:00Z",
  },
];

const TRIGGER_TYPES = [
  { id: "customer.created", label: "Nouveau Client / Contact WhatsApp", icon: <UserPlus className="w-4 h-4 text-[#5865F2]" /> },
  { id: "order.updated", label: "Changement Statut Commande", icon: <ShoppingBag className="w-4 h-4 text-[var(--accent)]" /> },
  { id: "product.low_stock", label: "Alerte Stock Critique", icon: <AlertTriangle className="w-4 h-4 text-[var(--warm)]" /> },
  { id: "cart.abandoned", label: "Panier Abandonné", icon: <Clock className="w-4 h-4 text-[#EB459E]" /> },
  { id: "cron.scheduled", label: "Exécution Planifiée (Cron)", icon: <Zap className="w-4 h-4 text-[var(--success)]" /> },
];

const ACTION_TYPES = [
  { id: "auto_reply", label: "Envoyer Réponse WhatsApp Automatique", icon: <MessageSquare className="w-4 h-4 text-[var(--accent)]" /> },
  { id: "create_ticket", label: "Créer un Ticket Support", icon: <AlertTriangle className="w-4 h-4 text-[var(--warm)]" /> },
  { id: "dispatch_agent", label: "Assigner à un Agent IA Spécifique", icon: <Bot className="w-4 h-4 text-[#5865F2]" /> },
  { id: "notify_admin", label: "Alerter le Gérant par SMS / Email", icon: <Zap className="w-4 h-4 text-[var(--success)]" /> },
];

export default function AutomationPage() {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState<AutomationRule[]>(FALLBACK_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  const toggleRuleActive = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleTriggerTest = (rule: AutomationRule) => {
    setTestNotification(`Exécution simulée réussie pour : "${rule.name}"`);
    setTimeout(() => setTestNotification(null), 4000);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    setDeleteConfirmId(null);
  };

  const handleSaveRule = (formData: Partial<AutomationRule>) => {
    if (editingRule) {
      setRules(rules.map((r) => (r.id === editingRule.id ? ({ ...r, ...formData } as AutomationRule) : r)));
    } else {
      const newObj: AutomationRule = {
        id: `rule-${Date.now()}`,
        name: formData.name || "Nouvelle Automatisation",
        description: formData.description || "",
        trigger_type: formData.trigger_type || "customer.created",
        trigger_label: TRIGGER_TYPES.find((t) => t.id === formData.trigger_type)?.label || "Déclencheur",
        condition: formData.condition || "",
        action_type: formData.action_type || "auto_reply",
        action_label: ACTION_TYPES.find((a) => a.id === formData.action_type)?.label || "Action",
        action_detail: formData.action_detail || "",
        is_active: formData.is_active ?? true,
        executions_count: 0,
        success_rate: 100,
        last_triggered_at: null,
        created_at: new Date().toISOString(),
      };
      setRules([newObj, ...rules]);
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const totalExecutions = rules.reduce((acc, r) => acc + r.executions_count, 0);
  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Test feedback notification */}
      <AnimatePresence>
        {testNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] text-sm font-medium shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{testNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--warm-soft)] text-[var(--warm)] border border-[var(--warm)]/20 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Moteur de Flux Métier
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">
            Automatisation & Déclencheurs
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Programmez des règles intelligentes &quot;Quand [Déclencheur] ➔ Alors [Action]&quot; sans écrire une seule ligne de code.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRule(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all text-sm self-start md:self-auto"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="w-4 h-4" /> Créer un nouveau flux
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Flux Actifs"
          value={activeCount.toString()}
          subtext={`Sur ${rules.length} règles configurées`}
          icon={<Zap className="w-4 h-4 text-[var(--accent)]" />}
        />
        <KpiCard
          label="Exécutions Totales"
          value={totalExecutions.toLocaleString("fr-FR")}
          subtext="Actions automatiques menées"
          icon={<Play className="w-4 h-4 text-[var(--success)]" />}
        />
        <KpiCard
          label="Taux de Réussite"
          value="99.2%"
          subtext="Erreurs de distribution nulles"
          icon={<CheckCircle2 className="w-4 h-4 text-[#5865F2]" />}
        />
        <KpiCard
          label="Temps Moyen Déclenchement"
          value="0.3s"
          subtext="Réaction immédiate temps réel"
          icon={<Clock className="w-4 h-4 text-[var(--warm)]" />}
        />
      </div>

      {/* Flow Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Règles & Workflows Disponibles</h2>
          <span className="text-xs text-[var(--text-tertiary)]">{rules.length} règles</span>
        </div>

        <div className="space-y-4">
          {rules.map((rule) => {
            return (
              <motion.div
                key={rule.id}
                layout
                className={`rounded-3xl bg-[var(--surface)] border transition-all p-5 md:p-6 shadow-sm hover:shadow-md ${
                  rule.is_active ? "border-[var(--border)]" : "border-[var(--border)] opacity-60 bg-[var(--bg)]/40"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info & Flow Pipeline visual */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-sm md:text-base text-[var(--text-primary)]">{rule.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          rule.is_active
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--border)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        {rule.is_active ? "Actif" : "Désactivé"}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                      {rule.description}
                    </p>

                    {/* Visual Diagram: Quand ... Alors ... */}
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] font-medium">
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Quand :</span>
                        <span>{rule.trigger_label}</span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent)] font-medium">
                        <span className="text-[10px] font-bold opacity-75 uppercase">Alors :</span>
                        <span>{rule.action_label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border)]">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {rule.executions_count.toLocaleString("fr-FR")} décle.
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        Succès: {rule.success_rate}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerTest(rule)}
                        title="Tester manuellement le flux"
                        className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors border border-[var(--border)]"
                      >
                        <Play className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        title={rule.is_active ? "Mettre en pause" : "Activer"}
                        className={`p-2 rounded-xl transition-colors border ${
                          rule.is_active
                            ? "border-[var(--success)]/30 text-[var(--success)] hover:bg-[var(--success-soft)]"
                            : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg)]"
                        }`}
                      >
                        {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsModalOpen(true);
                        }}
                        title="Modifier le flux"
                        className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(rule.id)}
                        title="Supprimer la règle"
                        className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal Créer / Modifier Workflow */}
      <AnimatePresence>
        {isModalOpen && (
          <AutomationModal
            initialData={editingRule}
            onClose={() => {
              setIsModalOpen(false);
              setEditingRule(null);
            }}
            onSave={handleSaveRule}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-base text-[var(--text-primary)]">Supprimer ce flux ?</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Les déclenchements automatiques liés à cette règle seront arrêtés immédiatement.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)]"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteRule(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--danger)] text-white"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
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
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

function AutomationModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData: AutomationRule | null;
  onClose: () => void;
  onSave: (data: Partial<AutomationRule>) => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [triggerType, setTriggerType] = useState<AutomationRule["trigger_type"]>(
    initialData?.trigger_type || "customer.created"
  );
  const [actionType, setActionType] = useState<AutomationRule["action_type"]>(
    initialData?.action_type || "auto_reply"
  );
  const [actionDetail, setActionDetail] = useState(
    initialData?.action_detail || "Merci pour votre message ! Un conseiller est à votre disposition."
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      trigger_type: triggerType,
      trigger_label: TRIGGER_TYPES.find((t) => t.id === triggerType)?.label || "Déclencheur",
      action_type: actionType,
      action_label: ACTION_TYPES.find((a) => a.id === actionType)?.label || "Action",
      action_detail: actionDetail.trim(),
      is_active: initialData?.is_active ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-[var(--text-primary)]">
              {initialData ? "Modifier la Règle d'Automatisation" : "Créer un Nouveau Flux Automatique"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Nom du workflow</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Réponse automatique WhatsApp après minuit"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Description d&apos;intention</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez brièvement l'utilité pour vos collaborateurs"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>

          {/* Trigger Select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">1. Déclencheur (Quand cet événement survient)</label>
            <div className="grid grid-cols-1 gap-2">
              {TRIGGER_TYPES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTriggerType(t.id as AutomationRule["trigger_type"])}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    triggerType === t.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">{t.icon}</div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{t.label}</span>
                  </div>
                  {triggerType === t.id && <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Action Select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">2. Action Consécutive (Alors exécuter)</label>
            <div className="grid grid-cols-1 gap-2">
              {ACTION_TYPES.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setActionType(a.id as AutomationRule["action_type"])}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    actionType === a.id
                      ? "border-[#5865F2] bg-[#5865F2]/10"
                      : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">{a.icon}</div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{a.label}</span>
                  </div>
                  {actionType === a.id && <CheckCircle2 className="w-4 h-4 text-[#5865F2]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Action Detail / Template */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Contenu du message ou paramètres d&apos;action</label>
            <textarea
              rows={3}
              required
              value={actionDetail}
              onChange={(e) => setActionDetail(e.target.value)}
              placeholder="Variables disponibles : {customer.name}, {order.reference}, {product.name}"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none leading-relaxed font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {initialData ? "Mettre à jour le flux" : "Activer le flux"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
