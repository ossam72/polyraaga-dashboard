"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Search, X, Package, ArrowLeft } from "lucide-react";

interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_main: boolean;
}

interface AttributeValue {
  id: number;
  attribute_name: string;
  value: string;
  hex_color: string;
}

export interface Variant {
  id: string;
  sku: string;
  price: string;
  stock: number;
  is_active: boolean;
  attribute_values: AttributeValue[];
  display_attributes: string;
  is_out_of_stock: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  compare_price: string | null;
  discount_percent: number;
  is_on_sale: boolean;
  stock: number;
  unit: string;
  images: ProductImage[];
  has_variants: boolean;
  total_stock: number;
  variants: Variant[];
}

interface ProductPickerProps {
  onClose: () => void;
  onSend: (product: Product, variant: Variant | null) => void;
}

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function ProductPicker({ onClose, onSend }: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [variantPickerFor, setVariantPickerFor] = useState<Product | null>(null);

  const search = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.set("search", term);
      params.set("ordering", "-created_at");
      const res = await apiFetch(`/api/v1/catalogue/products/?${params}`);
      const data = await res.json();
      setProducts(data.results ?? data ?? []);
    } catch (err) {
      console.error("Erreur recherche produits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleProductClick = async (product: Product) => {
    if (product.has_variants) {
      setVariantPickerFor(product);
      return;
    }
    setSendingId(product.id);
    await onSend(product, null);
    setSendingId(null);
  };

  const handleVariantClick = async (product: Product, variant: Variant) => {
    if (variant.is_out_of_stock) return;
    setSendingId(variant.id);
    await onSend(product, variant);
    setSendingId(null);
    setVariantPickerFor(null);
  };

  return (
    <div className="absolute inset-x-4 bottom-24 z-30 max-h-96 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          {variantPickerFor && (
            <button onClick={() => setVariantPickerFor(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <ArrowLeft size={16} />
            </button>
          )}
          <Package size={16} />
          {variantPickerFor ? variantPickerFor.name : "Choisir un produit"}
        </div>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <X size={18} />
        </button>
      </div>

      {!variantPickerFor && (
        <div className="border-b border-[var(--border)] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            <Search size={16} className="text-[var(--text-tertiary)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit du catalogue..."
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto p-2">
        {!variantPickerFor && (
          <>
            {loading && (
              <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">Recherche...</div>
            )}
            {!loading && products.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">Aucun produit trouvé.</div>
            )}

            {products.map((product) => {
              const image = product.images.find((i) => i.is_main) || product.images[0];
              const displayStock = product.has_variants ? product.total_stock : product.stock;

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={sendingId !== null}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-[var(--accent-soft)] disabled:opacity-50"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--border)]">
                    {image ? (
                      <img src={image.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--text-tertiary)]">
                        <Package size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--text-primary)]">{product.name}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>{formatFCFA(product.price)}</span>
                      <span>·</span>
                      <span>Stock : {displayStock}</span>
                      {product.has_variants && (
                        <>
                          <span>·</span>
                          <span style={{ color: "var(--accent)" }}>{product.variants.length} variantes</span>
                        </>
                      )}
                    </div>
                  </div>

                  {sendingId === product.id && (
                    <span className="text-xs" style={{ color: "var(--accent)" }}>Ajout...</span>
                  )}
                </button>
              );
            })}
          </>
        )}

        {variantPickerFor && (
          <div className="space-y-1.5 p-1">
            {variantPickerFor.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantClick(variantPickerFor, variant)}
                disabled={variant.is_out_of_stock || sendingId !== null}
                className="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition hover:bg-[var(--accent-soft)] disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  {variant.attribute_values.some((av) => av.hex_color) && (
                    <span
                      className="w-4 h-4 rounded-full border border-[var(--border)] shrink-0"
                      style={{ backgroundColor: variant.attribute_values.find((av) => av.hex_color)?.hex_color }}
                    />
                  )}
                  <span className="text-sm text-[var(--text-primary)]">{variant.display_attributes}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] shrink-0">
                  <span>{formatFCFA(variant.price)}</span>
                  <span
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={
                      variant.is_out_of_stock
                        ? { backgroundColor: "var(--danger-soft)", color: "var(--danger)" }
                        : { backgroundColor: "var(--bg)", color: "var(--text-tertiary)" }
                    }
                  >
                    {variant.is_out_of_stock ? "Épuisé" : `Stock : ${variant.stock}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}