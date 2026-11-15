"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plus,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Sliders,
  MessageSquare,
  Clock,
  ShieldCheck,
  X,
  Search,
  Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  is_active: boolean;
  temperature: number;
  max_tokens?: number;
  messages_count: number;
  avg_response_time: number;
  success_rate: number;
  color?: string;
  created_at: string;
}

const AVAILABLE_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o Omnimodel",
    provider: "OpenAI",
    desc: "Recommandé pour la négociation commerciale & l'analyse multimodale complexe.",
    badge: "Performant",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    desc: "Nuance linguistique hors pair, idéal pour le français, wolof, bambara et support chaleureux.",
    badge: "Qualité Max",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    desc: "Ultra-rapide, économique, idéal pour FAQ instantanée et qualification de prospects.",
    badge: "Ultra Rapide",
  },
];

const PRESET_COLORS = [
  "#5865F2", // Discord Blurple
  "#0A66C2", // Polyraaga Accent
  "#0F7A5C", // Emerald Success
  "#C2712B", // Amber Warm
  "#EB459E", // Fuchsia
  "#57F287", // Green
];

const FALLBACK_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Assistant Commercial WhatsApp",
    model: "claude-3-5-sonnet",
    system_prompt:
      "Tu es l'assistant commercial senior de Polyraaga. Tu réponds avec politesse, concision et professionnalisme. Tu conseilles les clients sur les tailles, prix, délais de livraison et facilités de paiement Orange Money / Wave.",
    is_active: true,
    temperature: 0.5,
    max_tokens: 1024,
    messages_count: 3420,
    avg_response_time: 0.9,
    success_rate: 98.4,
    color: "#5865F2",
    created_at: "2024-10-15T08:00:00Z",
  },
  {
    id: "agent-2",
    name: "Support Litiges & Réclamations",
    model: "gpt-4o",
    system_prompt:
      "Tu gères les retours d'articles, réclamations de livraison en retard et questions de remboursement. Sois empathique, rassurant, et demande toujours le numéro de suivi ou référence commande avant d'escalader au gérant.",
    is_active: true,
    temperature: 0.3,
    max_tokens: 800,
    messages_count: 1284,
    avg_response_time: 1.1,
    success_rate: 96.1,
    color: "#0F7A5C",
    created_at: "2024-11-01T12:00:00Z",
  },
  {
    id: "agent-3",
    name: "Relance Paniers & Promos",
    model: "gpt-4o-mini",
    system_prompt:
      "Agent proactif de réengagement client. Détecte les paniers abandonnés depuis plus de 2 heures et propose une réduction exclusive de 5% valable pendant 24h avec un ton amical.",
    is_active: false,
    temperature: 0.7,
    max_tokens: 512,
    messages_count: 852,
    avg_response_time: 0.4,
    success_rate: 91.5,
    color: "#C2712B",
    created_at: "2024-11-18T15:30:00Z",
  },
];

async function fetchAgents(): Promise<Agent[]> {
  try {
    const res = await apiFetch("/api/v1/agents/");
    if (!res.ok) return FALLBACK_AGENTS;
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? FALLBACK_AGENTS;
  } catch {
    return FALLBACK_AGENTS;
  }
}

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Agent | null>(null);

  const { data: agents = FALLBACK_AGENTS, isLoading } = useQuery({
    queryKey: ["agents-list"],
    queryFn: fetchAgents,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      try {
        await apiFetch(`/api/v1/agents/${id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_active }),
        });
      } catch (e) {
        console.warn("API offline, updated locally", e);
      }
      return { id, is_active };
    },
    onSuccess: ({ id, is_active }) => {
      queryClient.setQueryData<Agent[]>(["agents-list"], (old) =>
        (old ?? FALLBACK_AGENTS).map((ag) => (ag.id === id ? { ...ag, is_active } : ag))
      );
    },
  });

  const saveAgentMutation = useMutation({
    mutationFn: async (payload: Partial<Agent> & { id?: string }) => {
      if (payload.id) {
        try {
          await apiFetch(`/api/v1/agents/${payload.id}/`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.warn("API offline, patched locally", e);
        }
        return payload;
      } else {
        const newObj: Agent = {
          id: `agent-${Date.now()}`,
          name: payload.name || "Nouvel Agent",
          model: payload.model || "claude-3-5-sonnet",
          system_prompt: payload.system_prompt || "",
          is_active: payload.is_active ?? true,
          temperature: payload.temperature ?? 0.5,
          max_tokens: payload.max_tokens ?? 1024,
          messages_count: 0,
          avg_response_time: 0.6,
          success_rate: 100,
          color: payload.color || PRESET_COLORS[0],
          created_at: new Date().toISOString(),
        };
        try {
          await apiFetch(`/api/v1/agents/`, {
            method: "POST",
            body: JSON.stringify(newObj),
          });
        } catch (e) {
          console.warn("API offline, created locally", e);
        }
        return newObj;
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Agent[]>(["agents-list"], (old = FALLBACK_AGENTS) => {
        if (saved.id && old.some((a) => a.id === saved.id)) {
          return old.map((a) => (a.id === saved.id ? ({ ...a, ...saved } as Agent) : a));
        }
        return [saved as Agent, ...old];
      });
      setIsModalOpen(false);
      setEditingAgent(null);
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiFetch(`/api/v1/agents/${id}/`, { method: "DELETE" });
      } catch (e) {
        console.warn("API offline, deleted locally", e);
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Agent[]>(["agents-list"], (old = FALLBACK_AGENTS) =>
        old.filter((a) => a.id !== deletedId)
      );
      setDeleteCandidate(null);
    },
  });

  const filteredAgents = agents.filter((ag) => {
    const matchesSearch =
      ag.name.toLowerCase().includes(search.toLowerCase()) ||
      ag.system_prompt.toLowerCase().includes(search.toLowerCase()) ||
      ag.model.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === "active") return matchesSearch && ag.is_active;
    if (filterStatus === "inactive") return matchesSearch && !ag.is_active;
    return matchesSearch;
  });

  const activeCount = agents.filter((a) => a.is_active).length;
  const totalMessages = agents.reduce((acc, a) => acc + a.messages_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Agents IA & Automatisation
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Personnalisez les cerveaux conversationnels branchés sur WhatsApp, le Web et vos commandes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingAgent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-[#5865F2]/25 hover:opacity-90 active:scale-95 transition-all text-sm"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="w-4 h-4" />
          Déployer un nouvel agent
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Agents Déployés"
          value={agents.length.toString()}
          subtext="Configurés sur vos canaux"
          icon={<Bot className="w-4 h-4 text-[var(--accent)]" />}
        />
        <KpiCard
          label="En Ligne 24/7"
          value={activeCount.toString()}
          subtext={`${Math.round((activeCount / (agents.length || 1)) * 100)}% actifs`}
          icon={<CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}
        />
        <KpiCard
          label="Messages Traités"
          value={totalMessages.toLocaleString("fr-FR")}
          subtext="Sans intervention humaine"
          icon={<MessageSquare className="w-4 h-4 text-[#5865F2]" />}
        />
        <KpiCard
          label="Temps de Réponse Moyen"
          value="0.8s"
          subtext="Latence quasi-instantanée"
          icon={<Zap className="w-4 h-4 text-[var(--warm)]" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, mot-clé de prompt ou modèle..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs text-[var(--text-tertiary)] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> État :
          </span>
          {(["all", "active", "inactive"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === st
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {st === "all" ? "Tous" : st === "active" ? "Actifs" : "En pause"}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-[var(--surface)] border border-[var(--border)] animate-pulse"
            />
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--text-tertiary)]">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Aucun agent ne correspond à votre recherche
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Ajustez vos filtres ou créez votre prochain agent intelligent en quelques clics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredAgents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex flex-col justify-between bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Top colored status pill & model tag */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: agent.color || "var(--accent)" }}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                          {agent.name}
                        </h3>
                        <span className="text-[11px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-[#5865F2]" /> {agent.model}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: agent.id,
                          is_active: !agent.is_active,
                        })
                      }
                      title={agent.is_active ? "Désactiver l'agent" : "Activer l'agent"}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        agent.is_active ? "bg-[var(--success)]" : "bg-[var(--border)]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          agent.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* System Prompt snippet */}
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-3 mb-4">
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed italic font-sans">
                      &quot;{agent.system_prompt}&quot;
                    </p>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border)] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">Traités</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {agent.messages_count.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">Réponse</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {agent.avg_response_time}s
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">Succès</span>
                      <span className="font-semibold text-[var(--success)]">
                        {agent.success_rate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                    <Clock className="w-3.5 h-3.5" />
                    Temp: {agent.temperature ?? 0.5}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const copyAgent = {
                          ...agent,
                          name: `${agent.name} (Copie)`,
                          id: undefined,
                        };
                        saveAgentMutation.mutate(copyAgent);
                      }}
                      title="Dupliquer l'agent"
                      className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingAgent(agent);
                        setIsModalOpen(true);
                      }}
                      title="Modifier les instructions"
                      className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(agent)}
                      title="Supprimer définitivement"
                      className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Create / Edit Agent */}
      <AnimatePresence>
        {isModalOpen && (
          <AgentFormModal
            initialData={editingAgent}
            onClose={() => {
              setIsModalOpen(false);
              setEditingAgent(null);
            }}
            onSave={(formData) => saveAgentMutation.mutate(formData)}
            isSaving={saveAgentMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Supprimer &quot;{deleteCandidate.name}&quot; ?
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Cet agent cessera de répondre immédiatement aux requêtes entrantes. Cette action est irréversible.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteAgentMutation.mutate(deleteCandidate.id)}
                  disabled={deleteAgentMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--danger)] text-white hover:opacity-90 transition-opacity"
                >
                  {deleteAgentMutation.isPending ? "Suppression..." : "Supprimer"}
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

function AgentFormModal({
  initialData,
  onClose,
  onSave,
  isSaving,
}: {
  initialData: Agent | null;
  onClose: () => void;
  onSave: (data: Partial<Agent> & { id?: string }) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [model, setModel] = useState(initialData?.model || "claude-3-5-sonnet");
  const [systemPrompt, setSystemPrompt] = useState(
    initialData?.system_prompt ||
      "Tu es un assistant e-commerce haut de gamme chez Polyraaga. Réponds aux questions avec précision, empathie et rapidité."
  );
  const [temperature, setTemperature] = useState(initialData?.temperature ?? 0.5);
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      model,
      system_prompt: systemPrompt.trim(),
      temperature,
      color,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-[var(--text-primary)]">
              {initialData ? "Modifier l'Agent IA" : "Créer un Nouvel Agent"}
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
          {/* Nom & Couleur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Nom de l&apos;agent</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Conseiller WhatsApp VIP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Couleur du badge</label>
              <div className="flex items-center gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "var(--text-primary)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Choix du modèle IA */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Cerveau IA / Modèle de fondation
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {AVAILABLE_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    model === m.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{m.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {m.provider}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-tight">{m.desc}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      model === m.id
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface)] text-[var(--text-tertiary)]"
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Système (Directives de comportement) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Directives & Prompt Système (Instructions maîtresses)
              </label>
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                {systemPrompt.length} car.
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Expliquez à l'agent son rôle, son ton, ses limites et comment il doit conclure ses ventes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Température & Créativité */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                Température (Créativité vs Précision factuelle)
              </label>
              <span className="text-xs font-mono font-bold text-[var(--accent)]">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>0.0 : Strict, mathématique, factuel</span>
              <span>1.0 : Chaleureux, expressif, vendeur</span>
            </div>
          </div>

          {/* Actions */}
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
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {isSaving ? "Sauvegarde en cours..." : initialData ? "Mettre à jour" : "Activer l'agent"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
