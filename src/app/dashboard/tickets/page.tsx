"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Bot,
  Phone,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TicketReply {
  id: number;
  sender_type: "customer" | "agent" | "ai";
  sender_name: string;
  content: string;
  created_at: string;
}

interface Ticket {
  id: string;
  reference: string;
  subject: string;
  description: string;
  customer_name: string;
  customer_phone: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: string;
  replies: TicketReply[];
  created_at: string;
  updated_at: string;
}

const FALLBACK_TICKETS: Ticket[] = [
  {
    id: "tk-1",
    reference: "TK-2024-0089",
    subject: "Retard de livraison - Commande #REF-2024-0092",
    description: "Le client signale que le colis devait être livré hier à Bamako ACI 2000. Le livreur ne répond pas au numéro indiqué.",
    customer_name: "Amadou Diallo",
    customer_phone: "+223 70 12 34 56",
    priority: "urgent",
    status: "open",
    assigned_to: "Agent Support Humain",
    created_at: "2024-11-18T10:00:00Z",
    updated_at: "2024-11-18T10:30:00Z",
    replies: [
      {
        id: 1,
        sender_type: "customer",
        sender_name: "Amadou Diallo",
        content: "Bonjour, mon colis devait arriver hier matin, toujours aucune nouvelle du transporteur.",
        created_at: "2024-11-18T10:00:00Z",
      },
      {
        id: 2,
        sender_type: "ai",
        sender_name: "Assistant IA Polyraaga",
        content: "Bonjour M. Diallo, nous prenons immédiatement en charge votre réclamation et contactons le dispatch logistique.",
        created_at: "2024-11-18T10:01:00Z",
      },
    ],
  },
  {
    id: "tk-2",
    reference: "TK-2024-0088",
    subject: "Demande d'échange de taille pour Robe Bazin",
    description: "La taille M reçue est légèrement trop cintrée. La cliente souhaite l'échanger contre une taille L sans frais supplémentaires.",
    customer_name: "Mariam Coulibaly",
    customer_phone: "+223 69 11 22 33",
    priority: "medium",
    status: "in_progress",
    assigned_to: "Assistant Commercial IA",
    created_at: "2024-11-17T15:20:00Z",
    updated_at: "2024-11-17T16:00:00Z",
    replies: [
      {
        id: 3,
        sender_type: "customer",
        sender_name: "Mariam Coulibaly",
        content: "Est-il possible de faire passer le coursier demain pour échanger la robe contre du L ?",
        created_at: "2024-11-17T15:20:00Z",
      },
      {
        id: 4,
        sender_type: "agent",
        sender_name: "Fatou (Support)",
        content: "Bonjour Mme Coulibaly, oui tout à fait ! Le stock en taille L est réservé pour votre échange demain à 14h.",
        created_at: "2024-11-17T16:00:00Z",
      },
    ],
  },
  {
    id: "tk-3",
    reference: "TK-2024-0085",
    subject: "Reçu de paiement Wave non validé",
    description: "Le client a effectué le virement Wave mais la commande est restée en attente pendant 15 minutes.",
    customer_name: "Ibrahim Traoré",
    customer_phone: "+223 65 78 90 12",
    priority: "high",
    status: "resolved",
    assigned_to: "Système Automatique",
    created_at: "2024-11-16T11:00:00Z",
    updated_at: "2024-11-16T11:15:00Z",
    replies: [
      {
        id: 5,
        sender_type: "customer",
        sender_name: "Ibrahim Traoré",
        content: "J'ai bien été débité de 18 500 FCFA sur mon compte Wave, voici la référence TXN-9912.",
        created_at: "2024-11-16T11:00:00Z",
      },
      {
        id: 6,
        sender_type: "agent",
        sender_name: "Comptabilité",
        content: "Paiement vérifié et validé avec succès. Votre commande est passée en préparation.",
        created_at: "2024-11-16T11:15:00Z",
      },
    ],
  },
];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: "var(--danger-soft)", text: "var(--danger)", border: "var(--danger)" },
  high: { bg: "var(--warm-soft)", text: "var(--warm)", border: "var(--warm)" },
  medium: { bg: "var(--accent-soft)", text: "var(--accent)", border: "var(--accent)" },
  low: { bg: "var(--bg)", text: "var(--text-tertiary)", border: "var(--border)" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "var(--danger-soft)", text: "var(--danger)", label: "Ouvert" },
  in_progress: { bg: "var(--accent-soft)", text: "var(--accent)", label: "En cours" },
  resolved: { bg: "var(--success-soft)", text: "var(--success)", label: "Résolu" },
  closed: { bg: "var(--bg)", text: "var(--text-tertiary)", label: "Clôturé" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(FALLBACK_TICKETS);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");

  const filteredTickets = useMemo(() => {
    return tickets.filter((tk) => {
      const matchSearch =
        tk.subject.toLowerCase().includes(search.toLowerCase()) ||
        tk.reference.toLowerCase().includes(search.toLowerCase()) ||
        tk.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        tk.customer_phone.includes(search);
      const matchPriority = filterPriority === "all" || tk.priority === filterPriority;
      const matchStatus = filterStatus === "all" || tk.status === filterStatus;
      return matchSearch && matchPriority && matchStatus;
    });
  }, [tickets, search, filterPriority, filterStatus]);

  const handleSendReply = () => {
    if (!selectedTicket || !replyDraft.trim()) return;
    const newReply: TicketReply = {
      id: Date.now(),
      sender_type: "agent",
      sender_name: "Vous (Équipe Support)",
      content: replyDraft.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = {
      ...selectedTicket,
      replies: [...selectedTicket.replies, newReply],
      status: "in_progress" as const,
      updated_at: new Date().toISOString(),
    };
    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setReplyDraft("");
  };

  const handleUpdateStatus = (ticketId: string, newStatus: Ticket["status"]) => {
    setTickets(
      tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const handleCreateTicket = (data: Partial<Ticket>) => {
    const newTk: Ticket = {
      id: `tk-${Date.now()}`,
      reference: `TK-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: data.subject || "Demande d'assistance",
      description: data.description || "",
      customer_name: data.customer_name || "Client Anonyme",
      customer_phone: data.customer_phone || "+223 70 00 00 00",
      priority: data.priority || "medium",
      status: "open",
      assigned_to: data.assigned_to || "Support Général",
      replies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTickets([newTk, ...tickets]);
    setIsNewModalOpen(false);
  };

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20 flex items-center gap-1.5">
              <LifeBuoy className="w-3.5 h-3.5" /> Centre d&apos;Assistance & SAV
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">
            Tickets de Support & Litiges
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gérez les réclamations clients, retours produits, questions de livraison et suivi après-vente.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all text-xs self-start md:self-auto"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="w-4 h-4" /> Créer un ticket
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tickets Ouverts"
          value={openTicketsCount.toString()}
          subtext="En attente de prise en charge"
          icon={<AlertCircle className="w-4 h-4 text-[var(--danger)]" />}
        />
        <KpiCard
          label="En Cours de Résolution"
          value={inProgressCount.toString()}
          subtext="Avec échanges en direct"
          icon={<Clock className="w-4 h-4 text-[var(--accent)]" />}
        />
        <KpiCard
          label="Résolus avec Succès"
          value={resolvedCount.toString()}
          subtext="Clients satisfaits"
          icon={<CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}
        />
        <KpiCard
          label="Délai Moyen Résolution"
          value="18 min"
          subtext="Réponse rapide garantie"
          icon={<LifeBuoy className="w-4 h-4 text-[#5865F2]" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-3 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Réf, sujet, nom client ou numéro..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
          >
            <option value="all">Tous les Statuts</option>
            <option value="open">Ouverts</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolus</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
          >
            <option value="all">Toutes Priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-12 text-center text-xs text-[var(--text-tertiary)]">
            Aucun ticket ne correspond aux critères sélectionnés.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const pStyle = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium;
            const sStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;

            return (
              <motion.div
                key={ticket.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedTicket(ticket)}
                className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all shadow-sm cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[var(--accent)]">{ticket.reference}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: pStyle.bg, color: pStyle.text }}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: sStyle.bg, color: sStyle.text }}
                    >
                      {sStyle.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {ticket.subject}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-2xl">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)] pt-1">
                    <span className="flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                      <User className="w-3 h-3" /> {ticket.customer_name}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" /> {ticket.customer_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Assigné à</span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{ticket.assigned_to}</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent-soft)] transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Ticket Details & Conversation Thread Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)] shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--accent)]">{selectedTicket.reference}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-secondary)]">
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{selectedTicket.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedTicket.id, e.target.value as Ticket["status"])
                    }
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="open">Ouvert</option>
                    <option value="in_progress">En cours</option>
                    <option value="resolved">Résolu</option>
                    <option value="closed">Clôturé</option>
                  </select>

                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Customer info subheader */}
              <div className="bg-[var(--bg)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)] shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--text-primary)]">{selectedTicket.customer_name}</span>
                  <span className="font-mono text-[var(--text-tertiary)]">{selectedTicket.customer_phone}</span>
                </div>
                <span>Assigné à : <strong className="text-[var(--text-primary)]">{selectedTicket.assigned_to}</strong></span>
              </div>

              {/* Chat Thread */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Original problem description */}
                <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-1 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block">Description initiale du litige :</span>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{selectedTicket.description}</p>
                </div>

                {selectedTicket.replies.map((reply) => {
                  const isCustomer = reply.sender_type === "customer";
                  const isAi = reply.sender_type === "ai";

                  return (
                    <div
                      key={reply.id}
                      className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                    >
                      <div className="text-[10px] text-[var(--text-tertiary)] mb-1 px-1">
                        {reply.sender_name} • {formatDate(reply.created_at)}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isCustomer
                          ? "bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)]"
                          : isAi
                            ? "bg-[#5865F2] text-white"
                            : "bg-[var(--accent)] text-white"
                          }`}
                      >
                        {reply.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-2">
                <input
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder="Écrire une réponse d'assistance officielle..."
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyDraft.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Créer Nouveau Ticket */}
      <AnimatePresence>
        {isNewModalOpen && (
          <CreateTicketModal
            onClose={() => setIsNewModalOpen(false)}
            onCreate={handleCreateTicket}
          />
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

function CreateTicketModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: Partial<Ticket>) => void;
}) {
  const [subject, setSubject] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+223 ");
  const [priority, setPriority] = useState<Ticket["priority"]>("medium");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !customerName.trim()) return;
    onCreate({
      subject: subject.trim(),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      priority,
      description: description.trim(),
      assigned_to: "Agent Support Humain",
    });
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
          <h3 className="font-bold text-base text-[var(--text-primary)]">Ouvrir un Nouveau Ticket</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Objet du litige / Réclamation</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: Problème de taille sur commande #REF-092"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Nom du client</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Amadou Diallo"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Téléphone</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+223 70 00 00 00"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Niveau de priorité</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Ticket["priority"])}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="low">Basse (Simple question)</option>
              <option value="medium">Moyenne (Demande d&apos;information commande)</option>
              <option value="high">Haute (Retard ou problème paiement)</option>
              <option value="urgent">Urgente (Client insatisfait / Colis perdu)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Détails de la réclamation</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez la situation exacte..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

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
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white"
            >
              Créer le ticket
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
