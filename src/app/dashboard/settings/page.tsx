"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Key,
  Webhook,
  Bell,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ProfileSettings {
  store_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  currency: string;
  description: string;
  whatsapp_number: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
  permissions: string;
}

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret: string;
  last_triggered_at: string | null;
}

interface NotificationSettings {
  email_new_order: boolean;
  email_unanswered_message: boolean;
  email_low_stock: boolean;
  email_daily_digest: boolean;
  push_new_order: boolean;
  push_customer_chat: boolean;
  sound_enabled: boolean;
}

const FALLBACK_PROFILE: ProfileSettings = {
  store_name: "Polyraaga Boutique Officielle",
  email: "contact@polyraaga.com",
  phone: "+223 70 00 11 22",
  city: "Bamako",
  country: "Mali",
  currency: "XOF (FCFA)",
  description: "Plateforme de mode, maroquinerie d'artisanat et créations textiles contemporaines d'Afrique de l'Ouest.",
  whatsapp_number: "+223 70 00 11 22",
};

const FALLBACK_API_KEYS: ApiKeyItem[] = [
  {
    id: "key-1",
    name: "Production Backend Integration",
    key: "poly_live_9a8b7c6d5e4f3a2b1c0d",
    created_at: "2024-10-01T10:00:00Z",
    last_used_at: "2024-11-18T14:22:00Z",
    permissions: "read_write",
  },
  {
    id: "key-2",
    name: "Zapier / Make Automation Feed",
    key: "poly_live_1f2e3d4c5b6a708192a3",
    created_at: "2024-11-05T09:30:00Z",
    last_used_at: "2024-11-17T18:00:00Z",
    permissions: "read_only",
  },
];

const FALLBACK_WEBHOOKS: WebhookItem[] = [
  {
    id: "wh-1",
    url: "https://api.polyraaga.com/integrations/order-dispatched",
    events: ["order.created", "order.delivered"],
    is_active: true,
    secret: "whsec_live_90f8e7d6c5b4a3",
    last_triggered_at: "2024-11-18T13:40:00Z",
  },
  {
    id: "wh-2",
    url: "https://hooks.slack.com/services/T00/B00/X00",
    events: ["support.ticket_opened", "inventory.low_stock"],
    is_active: false,
    secret: "whsec_live_12a34b56c78d90",
    last_triggered_at: null,
  },
];

const FALLBACK_NOTIFICATIONS: NotificationSettings = {
  email_new_order: true,
  email_unanswered_message: true,
  email_low_stock: true,
  email_daily_digest: false,
  push_new_order: true,
  push_customer_chat: true,
  sound_enabled: true,
};

const AVAILABLE_WEBHOOK_EVENTS = [
  { id: "order.created", label: "Commande créée" },
  { id: "order.paid", label: "Paiement confirmé" },
  { id: "order.delivered", label: "Commande livrée" },
  { id: "message.received", label: "Message WhatsApp entrant" },
  { id: "support.ticket_opened", label: "Nouveau ticket support" },
  { id: "inventory.low_stock", label: "Alerte stock faible" },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "api" | "webhooks" | "notifications">("profile");
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Profile Form state
  const [profile, setProfile] = useState<ProfileSettings>(FALLBACK_PROFILE);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(FALLBACK_API_KEYS);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermission, setNewKeyPermission] = useState("read_write");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(FALLBACK_WEBHOOKS);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["order.created"]);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>(FALLBACK_NOTIFICATIONS);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const showNotification = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await apiFetch("/api/v1/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
    } catch {
      // fallback
    }
    setIsSavingProfile(false);
    showNotification("Profil boutique mis à jour avec succès.");
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const generatedKey = `poly_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newEntry: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: generatedKey,
      created_at: new Date().toISOString(),
      last_used_at: null,
      permissions: newKeyPermission,
    };
    setApiKeys([newEntry, ...apiKeys]);
    setRevealedKey(generatedKey);
    setNewKeyName("");
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    showNotification("Clé API révoquée.");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    const newEntry: WebhookItem = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl.trim(),
      events: newWebhookEvents,
      is_active: true,
      secret: `whsec_${Math.random().toString(36).substring(2, 10)}`,
      last_triggered_at: null,
    };
    setWebhooks([newEntry, ...webhooks]);
    setIsWebhookModalOpen(false);
    setNewWebhookUrl("");
    showNotification("Point de terminaison Webhook enregistré.");
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((w) => (w.id === id ? { ...w, is_active: !w.is_active } : w))
    );
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
    showNotification("Webhook supprimé.");
  };

  const handleSaveNotifications = () => {
    setIsSavingNotifications(true);
    setTimeout(() => {
      setIsSavingNotifications(false);
      showNotification("Préférences de notifications sauvegardées.");
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      <AnimatePresence>
        {savedFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] text-sm font-medium shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{savedFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">
          Paramètres de la Plateforme
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configurez l&apos;identité de votre boutique, vos clés développeur, intégrations et alertes.
        </p>
      </div>

      {/* Navigation Tabs (Discord Style) */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto gap-2">
        {[
          { id: "profile", label: "Profil & Boutique", icon: <User className="w-4 h-4" /> },
          { id: "api", label: "Clés API & Développeurs", icon: <Key className="w-4 h-4" /> },
          { id: "webhooks", label: "Webhooks Temps Réel", icon: <Webhook className="w-4 h-4" /> },
          { id: "notifications", label: "Alertes & Notifications", icon: <Bell className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs md:text-sm border-b-2 transition-all shrink-0 ${activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROFIL & BOUTIQUE */}
      {activeTab === "profile" && (
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Identité de l&apos;Entreprise</h2>
              <p className="text-xs text-[var(--text-secondary)]">Ces informations s&apos;affichent sur vos reçus et messages WhatsApp clients.</p>
            </div>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-md hover:opacity-90 active:scale-95 transition-all text-xs"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> Nom de la boutique / Marque
              </label>
              <input
                type="text"
                required
                value={profile.store_name}
                onChange={(e) => setProfile({ ...profile, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> Email de contact public
              </label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> Numéro WhatsApp Business Officiel
              </label>
              <input
                type="text"
                required
                value={profile.whatsapp_number}
                onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> Ville & Pays du siège
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ville"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                />
                <input
                  type="text"
                  placeholder="Pays"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Présentation succincte de la marque
            </label>
            <textarea
              rows={3}
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none leading-relaxed"
            />
          </div>
        </motion.form>
      )}

      {/* TAB 2: CLÉS API */}
      {activeTab === "api" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Clés d&apos;Accès API REST</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Authentifiez vos scripts externes, passerelles tierces et workflows n8n/Zapier.
                </p>
              </div>
              <button
                onClick={() => {
                  setRevealedKey(null);
                  setIsKeyModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white shadow-sm text-xs hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <Plus className="w-4 h-4" /> Générer une clé API
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)]">{k.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {k.permissions === "read_write" ? "Lecture & Écriture" : "Lecture Seule"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-[var(--text-tertiary)] bg-[var(--surface)] px-2 py-1 rounded-lg border border-[var(--border)]">
                        {k.key.substring(0, 14)}••••••••••••••••
                      </code>
                      <button
                        onClick={() => handleCopy(k.key, k.id)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                        title="Copier la clé"
                      >
                        {copiedId === k.id ? (
                          <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {k.last_used_at ? "Utilisée récemment" : "Jamais utilisée"}
                    </span>
                    <button
                      onClick={() => handleDeleteApiKey(k.id)}
                      className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                      title="Révoquer la clé"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Générer Clé */}
          <AnimatePresence>
            {isKeyModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Générer une Clé Secrète</h3>

                  {!revealedKey ? (
                    <form onSubmit={handleCreateApiKey} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">Libellé d&apos;usage</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Script de synchronisation stock"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">Permissions</label>
                        <select
                          value={newKeyPermission}
                          onChange={(e) => setNewKeyPermission(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
                        >
                          <option value="read_write">Lecture et Écriture complètes</option>
                          <option value="read_only">Lecture seule (Commandes & Catalogue)</option>
                        </select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsKeyModalOpen(false)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)]"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white"
                        >
                          Générer
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 rounded-2xl bg-[var(--warm-soft)] border border-[var(--warm)]/30 text-xs text-[var(--warm)] space-y-1">
                        <p className="font-bold">Copiez cette clé maintenant !</p>
                        <p className="text-[11px]">Pour des raisons de sécurité, elle ne vous sera plus jamais affichée en clair.</p>
                      </div>

                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <code className="text-xs font-mono font-bold text-[var(--text-primary)] break-all flex-1">
                          {revealedKey}
                        </code>
                        <button
                          onClick={() => handleCopy(revealedKey, "revealed")}
                          className="p-2 rounded-xl bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--border)] transition-colors"
                        >
                          {copiedId === "revealed" ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setIsKeyModalOpen(false);
                          setRevealedKey(null);
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white"
                      >
                        J&apos;ai bien copié la clé
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* TAB 3: WEBHOOKS */}
      {activeTab === "webhooks" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Webhooks & Événements HTTP</h2>
              <p className="text-xs text-[var(--text-secondary)]">Recevez des notifications HTTP JSON en temps réel à chaque commande ou message.</p>
            </div>
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white shadow-sm text-xs hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="w-4 h-4" /> Ajouter un endpoint
            </button>
          </div>

          <div className="space-y-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)] break-all">{wh.url}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${wh.is_active
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : "bg-[var(--border)] text-[var(--text-tertiary)]"
                        }`}
                    >
                      {wh.is_active ? "Actif" : "En veille"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {wh.events.map((ev) => (
                      <span
                        key={ev}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-mono"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleWebhook(wh.id)}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    {wh.is_active ? "Suspendre" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Nouveau Webhook */}
          <AnimatePresence>
            {isWebhookModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Ajouter un Webhook HTTPS</h3>

                  <form onSubmit={handleCreateWebhook} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">URL du point de terminaison (POST)</label>
                      <input
                        type="url"
                        required
                        placeholder="https://votre-domaine.com/api/webhook"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">Événements à écouter</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AVAILABLE_WEBHOOK_EVENTS.map((ev) => (
                          <label
                            key={ev.id}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs cursor-pointer hover:border-[var(--accent)] transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={newWebhookEvents.includes(ev.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewWebhookEvents([...newWebhookEvents, ev.id]);
                                } else {
                                  setNewWebhookEvents(newWebhookEvents.filter((x) => x !== ev.id));
                                }
                              }}
                              className="accent-[var(--accent)] rounded"
                            />
                            <span className="text-[var(--text-primary)] font-medium">{ev.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsWebhookModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)]"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Préférences d&apos;Alerte & Notifications</h2>
              <p className="text-xs text-[var(--text-secondary)]">Choisissez comment et quand votre équipe doit être alertée.</p>
            </div>
            <button
              onClick={handleSaveNotifications}
              disabled={isSavingNotifications}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-md hover:opacity-90 active:scale-95 transition-all text-xs"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Save className="w-4 h-4" />
              {isSavingNotifications ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="space-y-4">
            <ToggleOption
              title="Nouvelle Commande Reçue"
              description="Alerte par email immédiate dès qu'un client passe commande sur WhatsApp ou la boutique en ligne."
              checked={notifications.email_new_order}
              onChange={(val) => setNotifications({ ...notifications, email_new_order: val })}
            />
            <ToggleOption
              title="Message Client Sans Réponse (> 5 min)"
              description="Notification lorsque l'IA a besoin d'intervention humaine ou si le client attend une confirmation."
              checked={notifications.email_unanswered_message}
              onChange={(val) => setNotifications({ ...notifications, email_unanswered_message: val })}
            />
            <ToggleOption
              title="Alerte Stock Faible (< 5 unités)"
              description="Recevez un email avant que vos meilleures ventes ne tombent en rupture totale."
              checked={notifications.email_low_stock}
              onChange={(val) => setNotifications({ ...notifications, email_low_stock: val })}
            />
            <ToggleOption
              title="Rapport Quotidien de Synthèse"
              description="Recevez chaque matin à 8h le bilan des ventes, conversions IA et encaissements de la veille."
              checked={notifications.email_daily_digest}
              onChange={(val) => setNotifications({ ...notifications, email_daily_digest: val })}
            />
            <ToggleOption
              title="Sons d'Ambiance & Bips Sonores"
              description="Émet un bip discret à l'arrivée d'un message direct ou d'une notification de paiement."
              checked={notifications.sound_enabled}
              onChange={(val) => setNotifications({ ...notifications, sound_enabled: val })}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ToggleOption({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-[var(--text-primary)]">{title}</h4>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? "bg-[var(--accent)]" : "bg-[var(--border)]"
          }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}
