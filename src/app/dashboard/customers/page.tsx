"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Star,
  CheckCircle2,
  X,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Tag as TagIcon,
} from "lucide-react";
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
  email?: string;
  city: string;
  is_verified: boolean;
  date_joined: string;
  orders_count: number;
  total_spent: number | null;
  last_order_date: string | null;
  tags: Tag[];
  score: number;
}

const FALLBACK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    username: "amadou_d",
    first_name: "Amadou",
    last_name: "Diallo",
    phone: "+223 70 12 34 56",
    email: "amadou.diallo@gmail.com",
    city: "Bamako",
    is_verified: true,
    date_joined: "2024-05-10T10:00:00Z",
    orders_count: 14,
    total_spent: 285000,
    last_order_date: "2024-11-16T12:30:00Z",
    score: 92,
    tags: [
      { id: 1, name: "VIP", slug: "vip", color: "#0A66C2" },
      { id: 2, name: "Fidèle", slug: "fidele", color: "#0F7A5C" },
    ],
  },
  {
    id: 2,
    username: "fatou_k",
    first_name: "Fatou",
    last_name: "Konaté",
    phone: "+223 76 55 44 33",
    email: "fatou.konate@yahoo.fr",
    city: "Sikasso",
    is_verified: true,
    date_joined: "2024-07-22T14:15:00Z",
    orders_count: 6,
    total_spent: 98000,
    last_order_date: "2024-11-10T16:00:00Z",
    score: 68,
    tags: [{ id: 3, name: "Maroquinerie", slug: "maroquinerie", color: "#C2712B" }],
  },
  {
    id: 3,
    username: "ibrahim_t",
    first_name: "Ibrahim",
    last_name: "Traoré",
    phone: "+223 65 78 90 12",
    email: "ibrahim.t@outlook.com",
    city: "Bamako",
    is_verified: false,
    date_joined: "2024-11-02T09:00:00Z",
    orders_count: 1,
    total_spent: 18500,
    last_order_date: "2024-11-02T09:20:00Z",
    score: 35,
    tags: [{ id: 4, name: "Nouveau", slug: "nouveau", color: "#5865F2" }],
  },
  {
    id: 4,
    username: "mariam_c",
    first_name: "Mariam",
    last_name: "Coulibaly",
    phone: "+223 69 11 22 33",
    email: "mariam.coul@gmail.com",
    city: "Ségou",
    is_verified: true,
    date_joined: "2024-08-14T11:45:00Z",
    orders_count: 9,
    total_spent: 145000,
    last_order_date: "2024-11-14T18:00:00Z",
    score: 79,
    tags: [{ id: 1, name: "VIP", slug: "vip", color: "#0A66C2" }],
  },
  {
    id: 5,
    username: "oumar_s",
    first_name: "Oumar",
    last_name: "Sangaré",
    phone: "+223 78 33 44 55",
    email: "oumar.sang@hotmail.com",
    city: "Mopti",
    is_verified: true,
    date_joined: "2024-06-01T08:30:00Z",
    orders_count: 18,
    total_spent: 390000,
    last_order_date: "2024-11-18T10:15:00Z",
    score: 96,
    tags: [
      { id: 1, name: "VIP", slug: "vip", color: "#0A66C2" },
      { id: 5, name: "Gros Acheteur", slug: "gros-acheteur", color: "#EB459E" },
    ],
  },
];

function formatFCFA(n: number | null) {
  if (!n) return "0 FCFA";
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string | null) {
  if (!iso) return "Aucune";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function fetchCustomers(): Promise<Customer[]> {
  try {
    const res = await apiFetch("/api/v1/crm/customers/");
    if (!res.ok) return FALLBACK_CUSTOMERS;
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? FALLBACK_CUSTOMERS;
  } catch {
    return FALLBACK_CUSTOMERS;
  }
}

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: customers = FALLBACK_CUSTOMERS, isLoading } = useQuery({
    queryKey: ["customers-directory"],
    queryFn: fetchCustomers,
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (payload: Partial<Customer>) => {
      try {
        await apiFetch("/api/v1/crm/customers/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("API offline, added locally", err);
      }
      return payload;
    },
    onSuccess: (newCust) => {
      const createdObj: Customer = {
        id: Date.now(),
        username: (newCust.first_name || "client").toLowerCase(),
        first_name: newCust.first_name || "",
        last_name: newCust.last_name || "",
        phone: newCust.phone || "",
        email: newCust.email || "",
        city: newCust.city || "Bamako",
        is_verified: true,
        date_joined: new Date().toISOString(),
        orders_count: 0,
        total_spent: 0,
        last_order_date: null,
        tags: [{ id: 99, name: "Nouveau", slug: "nouveau", color: "#5865F2" }],
        score: 40,
      };
      queryClient.setQueryData<Customer[]>(["customers-directory"], (old = FALLBACK_CUSTOMERS) => [
        createdObj,
        ...old,
      ]);
      setIsAddModalOpen(false);
      setNotice(`Client ${createdObj.first_name} ${createdObj.last_name} ajouté avec succès.`);
      setTimeout(() => setNotice(null), 4000);
    },
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.city.toLowerCase().includes(search.toLowerCase());

      if (activeTag === "all") return matchesSearch;
      return matchesSearch && c.tags.some((t) => t.slug === activeTag);
    });
  }, [customers, search, activeTag]);

  const handleExportCSV = () => {
    const headers = "ID,Prénom,Nom,Téléphone,Email,Ville,Commandes,Total Dépensé (FCFA),Score\n";
    const rows = filteredCustomers
      .map(
        (c) =>
          `${c.id},"${c.first_name}","${c.last_name}","${c.phone}","${c.email || ""}","${c.city}",${
            c.orders_count
          },${c.total_spent || 0},${c.score}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients_polyraaga_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Export CSV téléchargé avec succès.");
    setTimeout(() => setNotice(null), 3000);
  };

  const totalSpentAll = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
  const avgOrderValue = Math.round(totalSpentAll / (customers.length || 1));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] text-sm font-medium shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Répertoire Clientèle
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">
            Base Contacts & Clients
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Visualisez les comportements d&apos;achat, segments VIP et historiques WhatsApp de chaque acheteur.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-all text-xs font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all text-xs"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <UserPlus className="w-4 h-4" /> Ajouter un client
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Clients"
          value={customers.length.toString()}
          subtext="Enregistrés dans la base"
          icon={<Users className="w-4 h-4 text-[var(--accent)]" />}
        />
        <KpiCard
          label="Clients VIP / Fidèles"
          value={customers.filter((c) => c.score >= 70).length.toString()}
          subtext="Score de fidélité élevé"
          icon={<Star className="w-4 h-4 text-[var(--warm)]" />}
        />
        <KpiCard
          label="Chiffre d'Affaires Cumulé"
          value={formatFCFA(totalSpentAll)}
          subtext="Volume d'achat total"
          icon={<ShoppingBag className="w-4 h-4 text-[var(--success)]" />}
        />
        <KpiCard
          label="Panier Moyen par Client"
          value={formatFCFA(avgOrderValue)}
          subtext="Dépense moyenne / contact"
          icon={<Sparkles className="w-4 h-4 text-[#5865F2]" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-3 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, ville..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto self-start sm:self-auto pb-1 sm:pb-0">
          {[
            { slug: "all", label: "Tous" },
            { slug: "vip", label: "VIP" },
            { slug: "fidele", label: "Fidèles" },
            { slug: "nouveau", label: "Nouveaux" },
          ].map((tag) => (
            <button
              key={tag.slug}
              onClick={() => setActiveTag(tag.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                activeTag === tag.slug
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table / Cards */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 md:p-6 shadow-sm overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Liste des Contacts ({filteredCustomers.length})
          </h2>
          <span className="text-xs text-[var(--text-tertiary)]">Cliquez sur un profil pour ouvrir la fiche CRM</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[var(--bg)] animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)] text-xs">
            Aucun client ne correspond à ce filtre.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredCustomers.map((c) => {
              const displayName = `${c.first_name} ${c.last_name}`.trim() || c.username;
              const initials = displayName.slice(0, 2).toUpperCase();

              return (
                <motion.div
                  key={c.id}
                  whileHover={{ backgroundColor: "var(--bg)" }}
                  onClick={() => router.push(`/dashboard/crm/${c.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 rounded-2xl transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shadow-sm"
                      style={{
                        backgroundColor:
                          c.score >= 80 ? "var(--accent)" : c.score >= 50 ? "#5865F2" : "#8A8D98",
                      }}
                    >
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          {displayName}
                        </span>
                        {c.is_verified && (
                          <span title="Client Vérifié">
                            <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {c.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.tags.map((t) => (
                      <span
                        key={t.id}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${t.color}15`,
                          color: t.color,
                          border: `1px solid ${t.color}30`,
                        }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>

                  {/* Right: Orders & Score */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                    <div className="text-right">
                      <div className="font-bold text-[var(--text-primary)]">{formatFCFA(c.total_spent)}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        {c.orders_count} commande{c.orders_count > 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor:
                            c.score >= 70
                              ? "var(--success-soft)"
                              : c.score >= 40
                              ? "var(--warm-soft)"
                              : "var(--border)",
                          color:
                            c.score >= 70
                              ? "var(--success)"
                              : c.score >= 40
                              ? "var(--warm)"
                              : "var(--text-tertiary)",
                        }}
                      >
                        {c.score}/100
                      </div>

                      <ArrowUpRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Ajouter un Client */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Nouveau Profil Client</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AddCustomerForm
                onSubmit={(data) => addCustomerMutation.mutate(data)}
                isSubmitting={addCustomerMutation.isPending}
                onCancel={() => setIsAddModalOpen(false)}
              />
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

function AddCustomerForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  onSubmit: (data: Partial<Customer>) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+223 ");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bamako");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) return;
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--text-primary)]">Prénom *</label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="ex: Aminata"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--text-primary)]">Nom</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="ex: Touré"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--text-primary)]">Numéro WhatsApp *</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+223 70 00 00 00"
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--text-primary)]">Email (optionnel)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="aminata@example.com"
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--text-primary)]">Ville de livraison</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Bamako, Sikasso, Dakar..."
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex gap-2 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)]"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90"
        >
          {isSubmitting ? "Création..." : "Ajouter le client"}
        </button>
      </div>
    </form>
  );
}
