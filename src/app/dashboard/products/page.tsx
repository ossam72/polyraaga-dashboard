"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Plus, Package, X, Upload, Check,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id: number;
  image: string;
  is_main: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  compare_price: string | null;
  stock: number;
  unit: string;
  sku: string;
  category: Category;
  images: ProductImage[];
  status: string;
  status_display: string;
  pilier: string;
  pilier_display: string;
  is_featured: boolean;
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "var(--border)", text: "var(--text-tertiary)" },
  active: { bg: "var(--success-soft)", text: "var(--success)" },
  suspended: { bg: "var(--warm-soft)", text: "var(--warm)" },
  sold_out: { bg: "var(--danger-soft)", text: "var(--danger)" },
};

function formatFCFA(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

async function fetchMyProducts(search: string): Promise<Product[]> {
  const params = new URLSearchParams({ mine: "true" });
  if (search) params.set("search", search);
  const res = await apiFetch(`/api/v1/catalogue/products/?${params}`);
  if (!res.ok) throw new Error("Erreur chargement produits");
  const data = await res.json();
  return data.results ?? data;
}

async function fetchCategories(): Promise<Category[]> {
  const res = await apiFetch(`/api/v1/catalogue/categories/`);
  if (!res.ok) throw new Error("Erreur chargement catégories");
  const data = await res.json();
  return data.results ?? data;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState("");
  const queryClient = useQueryClient();

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["my-products", search],
    queryFn: () => fetchMyProducts(search),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const res = await apiFetch(`/api/v1/catalogue/products/${id}/stock/`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour stock");
      return res.json();
    },
    onSuccess: () => {
      setEditingStock(null);
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
  });

  const stats = {
    total: products?.length ?? 0,
    active: products?.filter((p) => p.status === "active").length ?? 0,
    lowStock: products?.filter((p) => p.stock > 0 && p.stock <= 5).length ?? 0,
    outOfStock: products?.filter((p) => p.stock === 0).length ?? 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Produits</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gérez votre catalogue et vos stocks
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Produits" value={stats.total.toString()} />
        <StatCard label="Actifs" value={stats.active.toString()} color="var(--success)" />
        <StatCard label="Stock faible" value={stats.lowStock.toString()} color="var(--warm)" />
        <StatCard label="Épuisés" value={stats.outOfStock.toString()} color="var(--danger)" />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-lg
                     bg-[var(--surface)] text-[var(--text-primary)]
                     focus:outline-none focus:border-[var(--accent)]
                     placeholder:text-[var(--text-tertiary)] transition"
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">Chargement...</div>
      )}
      {isError && (
        <div className="py-16 text-center text-sm" style={{ color: "var(--danger)" }}>
          Impossible de charger les produits.
        </div>
      )}
      {!isLoading && !isError && (products?.length ?? 0) === 0 && (
        <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">
          Aucun produit pour le moment.
        </div>
      )}

      {/* Product list */}
      <div className="space-y-2">
        {products?.map((p, i) => {
          const statusStyle = STATUS_STYLES[p.status] ?? STATUS_STYLES.draft;
          const image = p.images.find((img) => img.is_main) || p.images[0];

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              onClick={() => window.location.href = `/dashboard/products/${p.id}`}
              className="flex items-center gap-4 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition"
            >
              <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[var(--bg)] flex items-center justify-center">
                {image ? (
                  <img src={image.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {formatFCFA(p.price)} · {p.category?.name ?? "Sans catégorie"}
                </p>
              </div>

              {/* Stock éditable inline */}
              <div className="shrink-0">
                {editingStock === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="number"
                      min={0}
                      value={stockDraft}
                      onChange={(e) => setStockDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateStock.mutate({ id: p.id, stock: parseInt(stockDraft) || 0 });
                        }
                        if (e.key === "Escape") setEditingStock(null);
                      }}
                      className="w-16 px-2 py-1 text-xs text-center border border-[var(--accent)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] outline-none"
                    />
                    <button
                      onClick={() => updateStock.mutate({ id: p.id, stock: parseInt(stockDraft) || 0 })}
                      className="p-1 rounded-md hover:bg-[var(--accent-soft)]"
                      style={{ color: "var(--accent)" }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingStock(p.id);
                      setStockDraft(p.stock.toString());
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-full hover:opacity-70 transition"
                    style={{
                      backgroundColor: p.stock === 0 ? "var(--danger-soft)" : p.stock <= 5 ? "var(--warm-soft)" : "var(--bg)",
                      color: p.stock === 0 ? "var(--danger)" : p.stock <= 5 ? "var(--warm)" : "var(--text-secondary)",
                    }}
                  >
                    Stock : {p.stock}
                  </button>
                )}
              </div>

              <span
                className="px-2.5 py-1 text-xs font-semibold rounded-full shrink-0"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
              >
                {p.status_display}
              </span>
            </motion.div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateProductModal
          categories={categories ?? []}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["my-products"] });
          }}
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

function CreateProductModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("unité");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !price || !categoryId) {
      setError("Nom, prix et catégorie sont obligatoires.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/v1/catalogue/products/`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: parseInt(price),
          stock: parseInt(stock) || 0,
          unit,
          category: parseInt(categoryId),
          status: "active",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(JSON.stringify(err) || "Erreur lors de la création.");
        return;
      }

      const product = await res.json();

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("is_main", "true");
        await apiFetch(`/api/v1/catalogue/products/${product.id}/images/`, {
          method: "POST",
          body: formData,
        });
      }

      onCreated();
    } catch (err) {
      console.error("Erreur création produit:", err);
      setError("Erreur réseau, réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Nouveau produit</span>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-full w-full object-cover rounded-xl" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Ajouter une photo</span>
              </>
            )}
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du produit"
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="Prix (FCFA)"
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              placeholder="Stock initial"
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] outline-none"
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {error && (
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {submitting ? "Création..." : "Créer le produit"}
          </button>
        </div>
      </div>
    </div>
  );
}