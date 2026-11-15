"use client";

import { Plus, Minus, X, ShoppingCart } from "lucide-react";
import type { Product, Variant } from "./ProductPicker";

export interface CartItem {
  product: Product;
  variant: Variant | null;
  quantity: number;
}

interface CartPanelProps {
  cart: CartItem[];
  onAddProduct: () => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemoveItem: (key: string) => void;
  onCheckout: () => void;
}

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export function cartItemKey(item: CartItem) {
  return item.variant ? `${item.product.id}:${item.variant.id}` : item.product.id;
}

export default function CartPanel({
  cart,
  onAddProduct,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartPanelProps) {
  const subtotal = cart.reduce((sum, item) => {
    const price = item.variant ? parseFloat(item.variant.price) : parseFloat(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[var(--text-tertiary)]">
            <ShoppingCart className="w-8 h-8" />
            Panier vide pour le moment.
          </div>
        )}

        {cart.map((item) => {
          const key = cartItemKey(item);
          const price = item.variant ? parseFloat(item.variant.price) : parseFloat(item.product.price);
          const maxStock = item.variant ? item.variant.stock : item.product.stock;
          const image = item.product.images?.[0];

          return (
            <div key={key} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--border)]">
                {image && <img src={image.image} alt={item.product.name} className="h-full w-full object-cover" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {item.product.name}
                  {item.variant && (
                    <span className="text-[var(--text-tertiary)] font-normal"> · {item.variant.display_attributes}</span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {formatFCFA(price)} × {item.quantity} = {formatFCFA(price * item.quantity)}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onUpdateQuantity(key, Math.max(1, item.quantity - 1))}
                  className="rounded-lg border border-[var(--border)] p-1 text-[var(--text-secondary)] hover:bg-[var(--border)]"
                >
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-xs font-semibold text-[var(--text-primary)]">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(key, Math.min(maxStock, item.quantity + 1))}
                  className="rounded-lg border border-[var(--border)] p-1 text-[var(--text-secondary)] hover:bg-[var(--border)]"
                >
                  <Plus size={12} />
                </button>
                <button onClick={() => onRemoveItem(key)} className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--danger)]">
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={onAddProduct}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
        >
          <Plus size={16} />
          Ajouter un produit
        </button>
      </div>

      {cart.length > 0 && (
        <div className="border-t border-[var(--border)] p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Sous-total</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatFCFA(subtotal)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Passer à la livraison ({cart.length} article{cart.length > 1 ? "s" : ""})
          </button>
        </div>
      )}
    </div>
  );
}