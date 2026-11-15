"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, X, Trash2, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AttributeValue {
  id: number;
  attribute: number;
  attribute_name: string;
  value: string;
  hex_color: string;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  values: AttributeValue[];
}

interface Variant {
  id: string;
  sku: string;
  price_override: string | null;
  price: string;
  stock: number;
  is_active: boolean;
  attribute_values: AttributeValue[];
  display_attributes: string;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

interface ProductDetail {
  id: string;
  name: string;
  price: string;
  stock: number;
  has_variants: boolean;
  total_stock: number;
  variants: Variant[];
}

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

async function fetchProduct(id: string): Promise<ProductDetail> {
  const res = await apiFetch(`/api/v1/catalogue/products/${id}/`);
  if (!res.ok) throw new Error("Produit introuvable");
  return res.json();
}

async function fetchAttributes(): Promise<Attribute[]> {
  const res = await apiFetch(`/api/v1/catalogue/attributes/`);
  if (!res.ok) throw new Error("Erreur chargement attributs");
  const data = await res.json();
  return data.results ?? data;
}

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const queryClient = useQueryClient();

  const [showNewVariant, setShowNewVariant] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-detail", productId],
    queryFn: () => fetchProduct(productId),
  });

  const { data: attributes } = useQuery({
    queryKey: ["attributes"],
    queryFn: fetchAttributes,
  });

  const updateVariant = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const res = await apiFetch(`/api/v1/catalogue/products/${productId}/variants/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      return res.json();
    },
    onSuccess: () => {
      setEditingStockId(null);
      queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
    },
  });

  const deleteVariant = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/catalogue/products/${productId}/variants/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Erreur suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
    },
  });

  if (isLoading || !product) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center text-sm text-[var(--text-tertiary)]">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => router.push("/dashboard/products")}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux produits
      </button>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{product.name}</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Prix de base : {formatFCFA(product.price)} · Stock total : {product.total_stock}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Variantes ({product.variants.length})
        </h2>
        <button
          onClick={() => setShowNewVariant(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle variante
        </button>
      </div>

      <div className="space-y-2">
        {product.variants.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[var(--text-tertiary)] border border-dashed border-[var(--border)] rounded-xl">
            <Package className="w-6 h-6" />
            Aucune variante — ce produit se vend en stock unique.
          </div>
        )}

        {product.variants.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-4 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {v.display_attributes || "Sans attribut"}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {v.sku} · {formatFCFA(v.price)}
              </p>
            </div>

            {editingStockId === v.id ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="number"
                  min={0}
                  value={stockDraft}
                  onChange={(e) => setStockDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateVariant.mutate({ id: v.id, stock: parseInt(stockDraft) || 0 });
                    }
                    if (e.key === "Escape") setEditingStockId(null);
                  }}
                  className="w-16 px-2 py-1 text-xs text-center border border-[var(--accent)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingStockId(v.id);
                  setStockDraft(v.stock.toString());
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-full hover:opacity-70 transition"
                style={{
                  backgroundColor: v.is_out_of_stock ? "var(--danger-soft)" : v.is_low_stock ? "var(--warm-soft)" : "var(--bg)",
                  color: v.is_out_of_stock ? "var(--danger)" : v.is_low_stock ? "var(--warm)" : "var(--text-secondary)",
                }}
              >
                Stock : {v.stock}
              </button>
            )}

            <button
              onClick={() => {
                if (confirm(`Supprimer la variante "${v.display_attributes}" ?`)) {
                  deleteVariant.mutate(v.id);
                }
              }}
              className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {showNewVariant && (
        <NewVariantModal
          productId={productId}
          attributes={attributes ?? []}
          onClose={() => setShowNewVariant(false)}
          onCreated={() => {
            setShowNewVariant(false);
            queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
            queryClient.invalidateQueries({ queryKey: ["attributes"] });
          }}
        />
      )}
    </div>
  );
}

function NewVariantModal({
  productId,
  attributes,
  onClose,
  onCreated,
}: {
  productId: string;
  attributes: Attribute[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedValueIds, setSelectedValueIds] = useState<number[]>([]);
  const [stock, setStock] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [newAttrName, setNewAttrName] = useState("");
  const [newValueName, setNewValueName] = useState("");
  const [newValueColor, setNewValueColor] = useState("#0A66C2");
  const [targetAttrId, setTargetAttrId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleValue = (id: number) => {
    setSelectedValueIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim()) return;
    try {
      const res = await apiFetch(`/api/v1/catalogue/attributes/`, {
        method: "POST",
        body: JSON.stringify({ name: newAttrName.trim() }),
      });
      if (res.ok) {
        setNewAttrName("");
        onCreated(); // refetch attributes list via parent invalidate
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddValue = async () => {
    if (!targetAttrId || !newValueName.trim()) return;
    try {
      const res = await apiFetch(`/api/v1/catalogue/attributes/${targetAttrId}/values/`, {
        method: "POST",
        body: JSON.stringify({ value: newValueName.trim(), hex_color: newValueColor }),
      });
      if (res.ok) {
        setNewValueName("");
        onCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/v1/catalogue/products/${productId}/variants/`, {
        method: "POST",
        body: JSON.stringify({
          attribute_value_ids: selectedValueIds,
          stock: parseInt(stock) || 0,
          price_override: priceOverride ? parseInt(priceOverride) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(JSON.stringify(err) || "Erreur lors de la création.");
        return;
      }

      onCreated();
    } catch (err) {
      console.error(err);
      setError("Erreur réseau, réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Nouvelle variante</span>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Attributs existants */}
          {attributes.map((attr) => (
            <div key={attr.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-2">
                {attr.name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {attr.values.map((val) => (
                  <button
                    key={val.id}
                    onClick={() => toggleValue(val.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-full border transition"
                    style={
                      selectedValueIds.includes(val.id)
                        ? { borderColor: "var(--accent)", backgroundColor: "var(--accent-soft)", color: "var(--text-primary)" }
                        : { borderColor: "var(--border)", color: "var(--text-secondary)" }
                    }
                  >
                    {val.hex_color && (
                      <span
                        className="w-3 h-3 rounded-full border border-[var(--border)]"
                        style={{ backgroundColor: val.hex_color }}
                      />
                    )}
                    {val.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Ajouter une valeur à un attribut existant */}
          {attributes.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 space-y-2">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Ajouter une valeur</p>
              <select
                value={targetAttrId ?? ""}
                onChange={(e) => setTargetAttrId(Number(e.target.value) || null)}
                className="w-full px-2.5 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] outline-none"
              >
                <option value="">Choisir un attribut</option>
                {attributes.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <input
                  type="color"
                  value={newValueColor}
                  onChange={(e) => setNewValueColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] shrink-0"
                />
                <input
                  value={newValueName}
                  onChange={(e) => setNewValueName(e.target.value)}
                  placeholder="Ex: Rouge, XL..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                />
                <button
                  onClick={handleAddValue}
                  disabled={!targetAttrId || !newValueName.trim()}
                  className="px-2.5 rounded-lg text-white text-xs disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Nouvel attribut */}
          <div className="rounded-xl border border-dashed border-[var(--border)] p-3 flex gap-1.5">
            <input
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              placeholder="Nouveau type d'attribut (ex: Taille)"
              className="flex-1 px-2.5 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            <button
              onClick={handleCreateAttribute}
              disabled={!newAttrName.trim()}
              className="px-2.5 rounded-lg text-xs border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg)]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              placeholder="Stock"
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            <input
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              type="number"
              placeholder="Prix (optionnel)"
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedValueIds.length === 0}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {submitting ? "Création..." : "Créer la variante"}
          </button>
        </div>
      </div>
    </div>
  );
}