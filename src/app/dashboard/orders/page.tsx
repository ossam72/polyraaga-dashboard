"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Package, ChevronDown, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  reference: string;
  status: string;
  status_display: string;
  user_email: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_city: string;
  delivery_street: string;
  subtotal: string;
  delivery_fee: string;
  total: string;
  notes: string;
  created_at: string;
  payment_method: string;
  paid_at: string | null;
  delivered_at: string | null;
  items: OrderItem[];
}

interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente de paiement" },
  { value: "confirmed", label: "Confirmée" },
  { value: "processing", label: "En préparation" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
  { value: "refunded", label: "Remboursée" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "var(--warm-soft)", text: "var(--warm)" },
  confirmed: { bg: "var(--accent-soft)", text: "var(--accent)" },
  processing: { bg: "var(--accent-soft)", text: "var(--accent)" },
  shipped: { bg: "var(--accent-soft)", text: "var(--accent)" },
  delivered: { bg: "var(--success-soft)", text: "var(--success)" },
  cancelled: { bg: "var(--danger-soft)", text: "var(--danger)" },
  refunded: { bg: "var(--border)", text: "var(--text-tertiary)" },
};

const PAGE_SIZE = 20;

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

async function fetchOrders(status: string, search: string, page: number): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("ordering", "-created_at");

  const res = await apiFetch(`/api/v1/orders/orders/?${params}`);
  if (!res.ok) throw new Error("Erreur chargement commandes");
  const data = await res.json();

  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", statusFilter, search, page],
    queryFn: () => fetchOrders(statusFilter, search, page),
  });

  const orders = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiFetch(`/api/v1/orders/orders/${id}/status/`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour statut");
      return res.json();
    },
    onSuccess: (updated: Order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
    },
  });

  const stats = {
    total: totalCount,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => ["confirmed", "processing", "shipped"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Commandes</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {totalCount} commande{totalCount > 1 ? "s" : ""} au total
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Sur cette page" value={orders.length.toString()} />
        <StatCard label="En attente" value={stats.pending.toString()} color="var(--warm)" />
        <StatCard label="En cours" value={stats.processing.toString()} color="var(--accent)" />
        <StatCard label="Livrées" value={stats.delivered.toString()} color="var(--success)" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Référence, nom, téléphone..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-lg
                       bg-[var(--surface)] text-[var(--text-primary)]
                       focus:outline-none focus:border-[var(--accent)]
                       placeholder:text-[var(--text-tertiary)] transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-4 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">Chargement...</div>
      )}
      {isError && (
        <div className="py-16 text-center text-sm" style={{ color: "var(--danger)" }}>
          Impossible de charger les commandes.
        </div>
      )}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">
          Aucune commande trouvée.
        </div>
      )}

      <div className="space-y-2">
        {orders.map((order, i) => {
          const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              className="flex items-center gap-4 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition"
            >
              <button
                onClick={() => setSelectedOrder(order)}
                className="flex items-center gap-4 flex-1 min-w-0 text-left"
              >
                <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
                  <Package className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">#{order.reference}</p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">
                    {order.delivery_name} · {order.delivery_city}
                  </p>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{formatFCFA(order.total)}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{formatDate(order.created_at)}</p>
                </div>
              </button>

              <QuickStatusDropdown
                order={order}
                onChange={(status) => updateStatus.mutate({ id: order.id, status })}
                style={style}
              />
            </motion.div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg)] transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg)] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={(status) => updateStatus.mutate({ id: selectedOrder.id, status })}
          updating={updateStatus.isPending}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
      <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-lg font-semibold" style={{ color: color || "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function QuickStatusDropdown({
  order,
  onChange,
  style,
}: {
  order: Order;
  onChange: (status: string) => void;
  style: { bg: string; text: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {order.status_display}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-20 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(s.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg)] transition"
              >
                {s.label}
                {order.status === s.value && <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  updating,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  updating: boolean;
}) {
  const isTerminal = order.status === "cancelled" || order.status === "refunded";
  const currentStepIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">#{order.reference}</span>
            <p className="text-xs text-[var(--text-tertiary)]">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Frise de progression */}
          {!isTerminal && (
            <div className="flex items-center justify-between px-1">
              {STATUS_FLOW.map((step, i) => {
                const isDone = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition"
                        style={{
                          backgroundColor: isDone ? "var(--accent)" : "var(--border)",
                          color: isDone ? "#fff" : "var(--text-tertiary)",
                          boxShadow: isCurrent ? "0 0 0 3px var(--accent-soft)" : "none",
                        }}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-1 transition"
                        style={{ backgroundColor: i < currentStepIndex ? "var(--accent)" : "var(--border)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isTerminal && (
            <div
              className="text-center py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: order.status === "cancelled" ? "var(--danger-soft)" : "var(--border)",
                color: order.status === "cancelled" ? "var(--danger)" : "var(--text-tertiary)",
              }}
            >
              {order.status_display}
            </div>
          )}

          {/* Status selector complet */}
          <select
            value={order.status}
            onChange={(e) => onUpdateStatus(e.target.value)}
            disabled={updating}
            className="w-full px-3 py-2.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Delivery info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1.5">Livraison</p>
            <p className="text-sm text-[var(--text-primary)]">{order.delivery_name} · {order.delivery_phone}</p>
            <p className="text-sm text-[var(--text-secondary)]">{order.delivery_street}, {order.delivery_city}</p>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1.5">Articles</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>{item.quantity}x {item.product_name}</span>
                <span>{formatFCFA(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold text-[var(--text-primary)] pt-1.5 border-t border-[var(--border)]">
              <span>Sous-total</span>
              <span>{formatFCFA(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Livraison</span>
              <span>{formatFCFA(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
              <span>Total</span>
              <span>{formatFCFA(order.total)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1.5">Paiement</p>
            <p className="text-sm text-[var(--text-primary)]">
              {order.payment_method === "cash_on_delivery" ? "À la livraison" : "Orange Money"}
            </p>
            {order.paid_at && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Payé le {formatDate(order.paid_at)}</p>
            )}
          </div>

          {order.notes && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1.5">Notes</p>
              <p className="text-sm text-[var(--text-secondary)]">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}