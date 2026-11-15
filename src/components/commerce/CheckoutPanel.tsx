"use client";

import { CartItem } from "./CartPanel";

interface CheckoutPanelProps {
  cart: CartItem[];
  deliveryName: string;
  setDeliveryName: (v: string) => void;
  deliveryPhone: string;
  setDeliveryPhone: (v: string) => void;
  deliveryStreet: string;
  setDeliveryStreet: (v: string) => void;
  deliveryCity: string;
  setDeliveryCity: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  paymentMethod: "orange_money_manual" | "cash_on_delivery";
  setPaymentMethod: (v: "orange_money_manual" | "cash_on_delivery") => void;
  formError: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function itemKey(item: CartItem) {
  return item.variant ? `${item.product.id}:${item.variant.id}` : item.product.id;
}

function itemPrice(item: CartItem) {
  return item.variant ? parseFloat(item.variant.price) : parseFloat(item.product.price);
}

export default function CheckoutPanel({
  cart,
  deliveryName, setDeliveryName,
  deliveryPhone, setDeliveryPhone,
  deliveryStreet, setDeliveryStreet,
  deliveryCity, setDeliveryCity,
  notes, setNotes,
  paymentMethod, setPaymentMethod,
  formError,
  submitting,
  onBack,
  onSubmit,
}: CheckoutPanelProps) {
  const subtotal = cart.reduce((sum, item) => sum + itemPrice(item) * item.quantity, 0);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {/* Récap panier */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 space-y-1.5">
        {cart.map((item) => (
          <div key={itemKey(item)} className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>
              {item.quantity}x {item.product.name}
              {item.variant && (
                <span className="text-[var(--text-tertiary)]"> ({item.variant.display_attributes})</span>
              )}
            </span>
            <span>{formatFCFA(itemPrice(item) * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold text-[var(--text-primary)] pt-1.5 border-t border-[var(--border)]">
          <span>Sous-total</span>
          <span>{formatFCFA(subtotal)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <input
          value={deliveryName}
          onChange={(e) => setDeliveryName(e.target.value)}
          placeholder="Nom du client"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <input
          value={deliveryPhone}
          onChange={(e) => setDeliveryPhone(e.target.value)}
          placeholder="Numéro de téléphone"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <input
          value={deliveryStreet}
          onChange={(e) => setDeliveryStreet(e.target.value)}
          placeholder="Adresse (rue, quartier)"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <input
          value={deliveryCity}
          onChange={(e) => setDeliveryCity(e.target.value)}
          placeholder="Ville"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optionnel)"
          rows={2}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Moyen de paiement
        </div>
        <button
          onClick={() => setPaymentMethod("orange_money_manual")}
          className="w-full rounded-xl border p-3 text-left text-sm transition"
          style={
            paymentMethod === "orange_money_manual"
              ? { borderColor: "var(--accent)", backgroundColor: "var(--accent-soft)", color: "var(--text-primary)" }
              : { borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-secondary)" }
          }
        >
          🟠 Orange Money — le client paie tout de suite
        </button>
        <button
          onClick={() => setPaymentMethod("cash_on_delivery")}
          className="w-full rounded-xl border p-3 text-left text-sm transition"
          style={
            paymentMethod === "cash_on_delivery"
              ? { borderColor: "var(--accent)", backgroundColor: "var(--accent-soft)", color: "var(--text-primary)" }
              : { borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-secondary)" }
          }
        >
          📦 Paiement à la livraison (+200 FCFA)
        </button>
      </div>

      {formError && (
        <div
          className="rounded-xl border px-3 py-2 text-xs"
          style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)", borderColor: "var(--danger)" }}
        >
          {formError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg)]"
        >
          Retour au panier
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {submitting ? "Création..." : "Confirmer la commande"}
        </button>
      </div>
    </div>
  );
}