"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, Calendar, Send, Plus, X, Tag as TagIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface Note {
  id: number;
  content: string;
  author_name: string | null;
  created_at: string;
}

interface CustomerDetail {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  is_verified: boolean;
  date_joined: string;
  orders_count: number;
  total_spent: number | null;
  score: number;
  tags: Tag[];
  notes: Note[];
  orange_money_number: string;
  moov_money_number: string;
  wave_number: string;
}

const TAG_COLORS = [
  "#0A66C2", "#0F7A5C", "#C2712B", "#B23B3B",
  "#6366F1", "#DB2777", "#0891B2", "#65A30D",
];

function displayName(c: CustomerDetail) {
  const full = `${c.first_name} ${c.last_name}`.trim();
  return full || c.username;
}

function formatFCFA(amount: number | null) {
  if (!amount) return "0 FCFA";
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

async function fetchCustomer(id: string): Promise<CustomerDetail> {
  const res = await apiFetch(`/api/v1/crm/customers/${id}/`);
  if (!res.ok) throw new Error("Client introuvable");
  return res.json();
}

async function fetchAllTags(): Promise<Tag[]> {
  const res = await apiFetch(`/api/v1/crm/tags/`);
  if (!res.ok) throw new Error("Erreur chargement tags");
  const data = await res.json();
  return data.results ?? data;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;
  const [noteContent, setNoteContent] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ["crm-customer", customerId],
    queryFn: () => fetchCustomer(customerId),
  });

  const { data: allTags } = useQuery({
    queryKey: ["crm-tags"],
    queryFn: fetchAllTags,
    enabled: showTagPicker,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiFetch(`/api/v1/crm/notes/`, {
        method: "POST",
        body: JSON.stringify({ customer: customerId, content }),
      });
      if (!res.ok) throw new Error("Erreur ajout note");
      return res.json();
    },
    onSuccess: () => {
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["crm-customer", customerId] });
    },
  });

  const assignTag = useMutation({
    mutationFn: async (tagId: number) => {
      const res = await apiFetch(`/api/v1/crm/customers/${customerId}/tags/`, {
        method: "POST",
        body: JSON.stringify({ tag_id: tagId }),
      });
      if (!res.ok) throw new Error("Erreur assignation tag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-customer", customerId] });
    },
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: number) => {
      const res = await apiFetch(`/api/v1/crm/customers/${customerId}/tags/${tagId}/`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Erreur retrait tag");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-customer", customerId] });
    },
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const res = await apiFetch(`/api/v1/crm/tags/`, {
        method: "POST",
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error("Erreur création tag");
      return res.json();
    },
    onSuccess: (newTag: Tag) => {
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      queryClient.invalidateQueries({ queryKey: ["crm-tags"] });
      assignTag.mutate(newTag.id);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center text-sm text-[var(--text-tertiary)]">
        Chargement...
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center text-sm" style={{ color: "var(--danger)" }}>
        Client introuvable.
      </div>
    );
  }

  const assignedIds = new Set(customer.tags.map((t) => t.id));
  const availableTags = (allTags ?? []).filter((t) => !assignedIds.has(t.id));

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => router.push("/dashboard/crm")}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </button>

      {/* Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full text-white text-lg font-medium flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {displayName(customer).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                {displayName(customer)}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {customer.phone}
                  </span>
                )}
                {customer.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {customer.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Depuis {formatDate(customer.date_joined)}
                </span>
              </div>
            </div>
          </div>

          <div
            className="px-3 py-1.5 rounded-full text-sm font-semibold shrink-0"
            style={{
              backgroundColor: customer.score >= 60 ? "var(--success-soft)" : customer.score >= 30 ? "var(--warm-soft)" : "var(--border)",
              color: customer.score >= 60 ? "var(--success)" : customer.score >= 30 ? "var(--warm)" : "var(--text-tertiary)",
            }}
          >
            Score {customer.score}/100
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {customer.tags.map((tag) => (
              <span
                key={tag.id}
                className="group flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium"
                style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => removeTag.mutate(tag.id)}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              onClick={() => setShowTagPicker((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium border border-dashed border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
            >
              <TagIcon className="w-3 h-3" />
              Ajouter
            </button>
          </div>

          {showTagPicker && (
            <div className="mt-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => assignTag.mutate(tag.id)}
                      className="px-2.5 py-1 text-xs rounded-full font-medium transition hover:opacity-70"
                      style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className="w-5 h-5 rounded-full shrink-0 transition"
                      style={{
                        backgroundColor: color,
                        outline: newTagColor === color ? `2px solid ${color}` : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTagName.trim()) {
                      createTag.mutate({ name: newTagName.trim(), color: newTagColor });
                    }
                  }}
                  placeholder="Nouveau tag..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-[var(--border)] rounded-lg
                             bg-[var(--surface)] text-[var(--text-primary)]
                             focus:outline-none focus:border-[var(--accent)]
                             placeholder:text-[var(--text-tertiary)]"
                />
                <button
                  onClick={() => newTagName.trim() && createTag.mutate({ name: newTagName.trim(), color: newTagColor })}
                  disabled={!newTagName.trim() || createTag.isPending}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-40 transition shrink-0"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Commandes</p>
          <p className="text-xl font-semibold text-[var(--text-primary)]">{customer.orders_count}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Total dépensé</p>
          <p className="text-xl font-semibold text-[var(--text-primary)]">{formatFCFA(customer.total_spent)}</p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Notes</h2>

        <div className="flex gap-2 mb-5">
          <input
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && noteContent.trim() && addNote.mutate(noteContent.trim())}
            placeholder="Ajouter une note sur ce client..."
            className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg
                       bg-[var(--bg)] text-[var(--text-primary)]
                       focus:outline-none focus:border-[var(--accent)]
                       placeholder:text-[var(--text-tertiary)]"
          />
          <button
            onClick={() => noteContent.trim() && addNote.mutate(noteContent.trim())}
            disabled={addNote.isPending || !noteContent.trim()}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 transition"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {customer.notes.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
              Aucune note pour ce client.
            </p>
          )}
          {customer.notes.map((note) => (
            <div key={note.id} className="border-l-2 pl-3" style={{ borderColor: "var(--accent)" }}>
              <p className="text-sm text-[var(--text-primary)]">{note.content}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {note.author_name || "Agent"} · {formatDate(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}