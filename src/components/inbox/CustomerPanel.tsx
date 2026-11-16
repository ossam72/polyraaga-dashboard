"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  Package,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import ProductPicker, { Product, Variant } from "@/components/commerce/ProductPicker";
import CartPanel, { CartItem, cartItemKey } from "@/components/commerce/CartPanel";
import CheckoutPanel from "@/components/commerce/CheckoutPanel";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface Order {
  id: string;
  reference: string;
  status: string;
  status_display: string;
  total: string;
  created_at: string;
  items: OrderItem[];
}

interface CustomerPanelProps {
  sessionId: number;
  customerId: number | null;
  clientName: string;
  clientPhone: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  confirmed: { bg: "#E0F2FE", text: "#075985", border: "#BAE6FD" },
  processing: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  shipped: { bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" },
  delivered: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  refunded: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
};

function initialsFrom(name: string, phone: string) {
  const source = name?.trim() || phone;
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function CustomerPanel({
  sessionId,
  customerId,
  clientName,
  clientPhone,
}: CustomerPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Modal panier/checkout ──
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalStep, setModalStep] = useState<"cart" | "picker" | "checkout">("cart");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState(clientPhone);
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Ouagadougou");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"orange_money_manual" | "cash_on_delivery">("orange_money_manual");

  const fetchOrders = useCallback(() => {
    if (!customerId) {
      setOrders([]);
      return;
    }

    setLoading(true);

    apiFetch(`/api/v1/orders/orders/?user=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        const results = Array.isArray(data) ? data : data.results ?? [];
        setOrders(results);
      })
      .catch((err) => console.error("Erreur chargement commandes:", err))
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const ringProgress =
    orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;

  const resetOrderForm = () => {
    setModalStep("cart");
    setCart([]);
    setDeliveryName("");
    setDeliveryPhone(clientPhone);
    setDeliveryStreet("");
    setDeliveryCity("Ouagadougou");
    setNotes("");
    setFormError(null);
    setPaymentMethod("orange_money_manual");
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    resetOrderForm();
  };

  const handleAddToCart = (product: Product, variant: Variant | null) => {
    setCart((prev) => {
      const key = variant ? `${product.id}:${variant.id}` : product.id;
      const existing = prev.find((item) => cartItemKey(item) === key);
      const maxStock = variant ? variant.stock : product.stock;

      if (existing) {
        return prev.map((item) =>
          cartItemKey(item) === key
            ? { ...item, quantity: Math.min(maxStock, item.quantity + 1) }
            : item
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });

    setModalStep("cart");
  };

  const handleUpdateQuantity = (key: string, quantity: number) => {
    setCart((prev) => prev.map((item) => (cartItemKey(item) === key ? { ...item, quantity } : item)));
  };

  const handleRemoveItem = (key: string) => {
    setCart((prev) => prev.filter((item) => cartItemKey(item) !== key));
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    if (!deliveryName.trim() || !deliveryPhone.trim() || !deliveryStreet.trim()) {
      setFormError("Nom, numéro et adresse sont obligatoires.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await apiFetch(`/api/v1/support/create-order/`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          items: cart.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant ? item.variant.id : null,
            quantity: item.quantity,
          })),
          delivery_name: deliveryName.trim(),
          delivery_phone: deliveryPhone.trim(),
          delivery_street: deliveryStreet.trim(),
          delivery_city: deliveryCity.trim(),
          notes,
          payment_method: paymentMethod,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "Erreur lors de la création de la commande.");
        return;
      }

      closeOrderModal();
      fetchOrders();
    } catch (err) {
      console.error("Erreur création commande:", err);
      setFormError("Erreur réseau, réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const markAsPaid = async (orderId: string) => {
    try {
      await apiFetch(`/api/v1/orders/orders/${orderId}/status/`, {
        method: "POST",
        body: JSON.stringify({ status: "confirmed" }),
      });
      fetchOrders();
    } catch (err) {
      console.error("Erreur mise à jour paiement:", err);
    }
  };

  if (!customerId) {
    return (
      <div className="flex h-full w-80 shrink-0 items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-tertiary)]">
        Aucun profil client lié à cette conversation pour le moment.
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-80 shrink-0 flex-col overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      {/* En-tête client avec anneau de progression */}
      <div className="flex flex-col items-center gap-3 border-b border-[var(--border)] p-6">
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r="35" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="35" fill="none" stroke="var(--accent)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - ringProgress / 100)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[var(--text-primary)]">
              {initialsFrom(clientName, clientPhone)}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="font-semibold text-[var(--text-primary)]">{clientName || clientPhone}</div>
          <div className="text-xs text-[var(--text-secondary)]">{clientPhone}</div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 pt-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[var(--text-tertiary)]">
              <Package size={12} />
              <span className="text-[10px] uppercase tracking-wide">Commandes</span>
            </div>
            <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">{orders.length}</div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[var(--text-tertiary)]">
              <TrendingUp size={12} />
              <span className="text-[10px] uppercase tracking-wide">Dépensé</span>
            </div>
            <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{formatFCFA(totalSpent)}</div>
          </div>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus size={16} />
          Nouvelle commande
        </button>
      </div>

      {/* Historique commandes */}
      <div className="flex-1 space-y-2 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Historique
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg)]" />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-8 text-center text-xs text-[var(--text-tertiary)]">
            <Clock size={20} className="text-[var(--text-tertiary)]" />
            Aucune commande pour ce client.
          </div>
        )}

        {!loading &&
          orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;

            return (
              <div key={order.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">#{order.reference}</div>
                    <div className="text-[11px] text-[var(--text-tertiary)]">{formatDate(order.created_at)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                    >
                      {order.status_display}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`text-[var(--text-tertiary)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>

                {order.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsPaid(order.id);
                    }}
                    className="mx-3 mb-3 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: "var(--success-soft)", color: "var(--success)", border: "1px solid var(--success)" }}
                  >
                    ✓ Marquer payé
                  </button>
                )}

                {isExpanded && (
                  <div className="space-y-1 border-t border-[var(--border)] p-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>{formatFCFA(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-sm font-semibold text-[var(--text-primary)]">
                      <span>Total</span>
                      <span>{formatFCFA(order.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Modal Panier/Checkout */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {modalStep === "cart" && "Panier"}
                {modalStep === "picker" && "Choisir un produit"}
                {modalStep === "checkout" && "Livraison & paiement"}
              </div>
              <button onClick={closeOrderModal} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <X size={18} />
              </button>
            </div>

            {modalStep === "cart" && (
              <CartPanel
                cart={cart}
                onAddProduct={() => setModalStep("picker")}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={() => setModalStep("checkout")}
              />
            )}

            {modalStep === "picker" && (
              <div className="relative h-[28rem]">
                <ProductPicker onClose={() => setModalStep("cart")} onSend={handleAddToCart} />
              </div>
            )}

            {modalStep === "checkout" && (
              <CheckoutPanel
                cart={cart}
                deliveryName={deliveryName} setDeliveryName={setDeliveryName}
                deliveryPhone={deliveryPhone} setDeliveryPhone={setDeliveryPhone}
                deliveryStreet={deliveryStreet} setDeliveryStreet={setDeliveryStreet}
                deliveryCity={deliveryCity} setDeliveryCity={setDeliveryCity}
                notes={notes} setNotes={setNotes}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                formError={formError}
                submitting={submitting}
                onBack={() => setModalStep("cart")}
                onSubmit={handleSubmitOrder}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}