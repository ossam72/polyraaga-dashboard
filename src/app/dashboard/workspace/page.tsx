"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  Crown,
  UserPlus,
  Mail,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Key,
  Layers,
  Settings,
  Pencil,
  X,
  Sparkles,
  ArrowRight,
  Activity,
  Check,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "invited" | "offline";
  is_owner: boolean;
  avatar_color: string;
  last_active_at: string | null;
}

interface ActivityEvent {
  id: string;
  actor_name: string;
  action: string;
  category: "product" | "order" | "agent" | "security";
  timestamp: string;
}

interface WorkspaceInfo {
  name: string;
  subdomain: string;
  plan: string;
  created_at: string;
  owner_name: string;
}

const FALLBACK_WORKSPACE: WorkspaceInfo = {
  name: "Polyraaga Flagship Store",
  subdomain: "polyraaga-main",
  plan: "Polyraaga Pro",
  created_at: "2024-06-15T10:00:00Z",
  owner_name: "Ossam Bangre",
};

const FALLBACK_MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "Ossam Bangre",
    email: "ossam@polyraaga.com",
    role: "admin",
    status: "active",
    is_owner: true,
    avatar_color: "#5865F2",
    last_active_at: "2024-11-18T14:45:00Z",
  },
  {
    id: "mem-2",
    name: "Aminata Traoré",
    email: "aminata.t@polyraaga.com",
    role: "editor",
    status: "active",
    is_owner: false,
    avatar_color: "#0A66C2",
    last_active_at: "2024-11-18T13:10:00Z",
  },
  {
    id: "mem-3",
    name: "Sékou Coulibaly",
    email: "sekou.logistique@polyraaga.com",
    role: "editor",
    status: "active",
    is_owner: false,
    avatar_color: "#0F7A5C",
    last_active_at: "2024-11-17T18:00:00Z",
  },
  {
    id: "mem-4",
    name: "Fatoumata Diarra",
    email: "fatou.diarra@audit.com",
    role: "viewer",
    status: "invited",
    is_owner: false,
    avatar_color: "#C2712B",
    last_active_at: null,
  },
];

const FALLBACK_ACTIVITIES: ActivityEvent[] = [
  {
    id: "act-1",
    actor_name: "Ossam Bangre",
    action: "a déployé le nouvel agent IA 'Conseiller WhatsApp VIP'",
    category: "agent",
    timestamp: "2024-11-18T14:30:00Z",
  },
  {
    id: "act-2",
    actor_name: "Aminata Traoré",
    action: "a ajouté 4 nouveaux sacs en cuir au catalogue",
    category: "product",
    timestamp: "2024-11-18T12:15:00Z",
  },
  {
    id: "act-3",
    actor_name: "Sékou Coulibaly",
    action: "a marqué la commande #REF-2024-0092 comme 'Livrée'",
    category: "order",
    timestamp: "2024-11-18T11:00:00Z",
  },
  {
    id: "act-4",
    actor_name: "Système de Sécurité",
    action: "a généré une nouvelle clé API REST 'Zapier Feed'",
    category: "security",
    timestamp: "2024-11-17T09:30:00Z",
  },
];

const PERMISSIONS_MATRIX = [
  { module: "Catalogue & Gestion des Produits", admin: true, editor: true, viewer: true },
  { module: "Prise & Validation des Commandes", admin: true, editor: true, viewer: true },
  { module: "Chat WhatsApp & Réponse Clients", admin: true, editor: true, viewer: false },
  { module: "Configuration des Agents IA", admin: true, editor: false, viewer: false },
  { module: "Statistiques & Données Chiffrées", admin: true, editor: true, viewer: true },
  { module: "Facturation, Cartes & Abonnements", admin: true, editor: false, viewer: false },
  { module: "Gestion des Membres & Clés API", admin: true, editor: false, viewer: false },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<WorkspaceInfo>(FALLBACK_WORKSPACE);
  const [members, setMembers] = useState<Member[]>(FALLBACK_MEMBERS);
  const [activities, setActivities] = useState<ActivityEvent[]>(FALLBACK_ACTIVITIES);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleChangeRole = (memberId: string, newRole: Member["role"]) => {
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    showNotification("Rôle du collaborateur mis à jour.");
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
    showNotification("Collaborateur retiré de l'espace de travail.");
  };

  const handleInvite = (email: string, role: Member["role"]) => {
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: email.split("@")[0],
      email,
      role,
      status: "invited",
      is_owner: false,
      avatar_color: "#5865F2",
      last_active_at: null,
    };
    setMembers([...members, newMember]);
    setIsInviteModalOpen(false);
    showNotification(`Invitation officielle envoyée à ${email}.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] text-sm font-medium shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Équipe & Permissions
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">
            Espace de Travail Collaboratif
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gérez les accès de vos gestionnaires de stock, agents du support client et comptables.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-[#5865F2]/25 hover:opacity-90 active:scale-95 transition-all text-xs self-start md:self-auto"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <UserPlus className="w-4 h-4" /> Inviter un collaborateur
        </button>
      </div>

      {/* Workspace Info Card */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-black text-xl shadow-md">
            {workspace.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{workspace.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-soft)] text-[var(--accent)]">
                {workspace.plan}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Fondé par <strong className="text-[var(--text-primary)]">{workspace.owner_name}</strong> • Créé le {new Date(workspace.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <div>
            <span className="block font-mono text-[var(--text-tertiary)]">Sous-domaine :</span>
            <span className="font-bold text-[var(--text-primary)]">{workspace.subdomain}.polyraaga.com</span>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Membres Actifs ({members.length})</h3>
            <p className="text-xs text-[var(--text-secondary)]">Personnes ayant accès aux commandes et échanges de la boutique.</p>
          </div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {members.map((m) => (
            <div
              key={m.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Identity */}
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                  style={{ backgroundColor: m.avatar_color }}
                >
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">{m.name}</span>
                    {m.is_owner && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--warm)] px-2 py-0.5 rounded-full bg-[var(--warm-soft)]">
                        <Crown className="w-3 h-3" /> Propriétaire
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        m.status === "active"
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : "bg-[var(--warm-soft)] text-[var(--warm)]"
                      }`}
                    >
                      {m.status === "active" ? "Actif" : "Invitation envoyée"}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] font-mono">{m.email}</span>
                </div>
              </div>

              {/* Role Select & Actions */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                {m.is_owner ? (
                  <span className="text-xs font-bold text-[var(--accent)] px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    Administrateur Général
                  </span>
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.id, e.target.value as Member["role"])}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="admin">Administrateur</option>
                    <option value="editor">Éditeur (Commandes & Chat)</option>
                    <option value="viewer">Lecteur (Consultation Seule)</option>
                  </select>
                )}

                {!m.is_owner && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                    title="Retirer le collaborateur"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Matrice des Droits & Rôles</h3>
          <p className="text-xs text-[var(--text-secondary)]">Aperçu transparent des privilèges accordés selon le rôle attribué.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Module Applicatif</th>
                <th className="pb-3 text-center">Administrateur</th>
                <th className="pb-3 text-center">Éditeur</th>
                <th className="pb-3 text-center pr-2">Lecteur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {PERMISSIONS_MATRIX.map((p, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg)]/50 transition-colors">
                  <td className="py-3 pl-2 font-medium text-[var(--text-primary)]">{p.module}</td>
                  <td className="py-3 text-center">
                    <span className="inline-block p-1 rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {p.editor ? (
                      <span className="inline-block p-1 rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">-</span>
                    )}
                  </td>
                  <td className="py-3 text-center pr-2">
                    {p.viewer ? (
                      <span className="inline-block p-1 rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log Audit */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#5865F2]" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Journal d&apos;Audit & Sécurité</h3>
        </div>

        <div className="space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-[var(--text-primary)]">{act.actor_name} </span>
                <span className="text-[var(--text-secondary)]">{act.action}</span>
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] shrink-0 font-mono">
                {formatDate(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Inviter un Collaborateur */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <InviteMemberModal
            onClose={() => setIsInviteModalOpen(false)}
            onInvite={handleInvite}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InviteMemberModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string, role: Member["role"]) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("editor");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="font-bold text-base text-[var(--text-primary)]">Inviter dans l&apos;Équipe</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Adresse Email Professionnelle</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborateur@polyraaga.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Rôle Attribué</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Member["role"])}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="editor">Éditeur (Peut gérer commandes & chat)</option>
              <option value="admin">Administrateur (Accès complet)</option>
              <option value="viewer">Lecteur (Consultation seulement)</option>
            </select>
          </div>

          <p className="text-[11px] text-[var(--text-tertiary)] leading-normal">
            Un email d&apos;invitation contenant un lien sécurisé d&apos;activation sera immédiatement envoyé.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90"
            >
              Envoyer l&apos;invitation
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
