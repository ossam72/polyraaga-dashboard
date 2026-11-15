"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { FileText, Download, Paperclip, X, Package } from "lucide-react";
import ProductPicker from "@/components/commerce/ProductPicker";
import CustomerPanel from "@/components/inbox/CustomerPanel";

interface Message {
  id: number;
  direction: "INCOMING" | "OUTGOING";
  sender: "CUSTOMER" | "AI" | "AGENT";
  message_type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PRODUCT";
  content: string;
  media_url: string | null;
  media_mime_type: string | null;
  created_at: string;
}

interface Session {
  id: number;
  client_phone: string;
  client_name: string;
  customer: number | null;
  status: string;
  assigned_agent: number | null;
  started_at: string;
  last_message_at: string;
  messages: Message[];
}

/**
 * Les fichiers médias WhatsApp sont hébergés sur le domaine ngrok du
 * backend Django. ngrok (plan gratuit) bloque les requêtes chargées en
 * tant que ressource intégrée (<img>/<video>/<audio> src) sans le header
 * "ngrok-skip-browser-warning". On fait donc passer ces fichiers par un
 * proxy interne Next.js (/api/media-proxy/...) qui ajoute ce header
 * côté serveur avant de renvoyer le fichier au navigateur.
 */
function toProxiedMediaUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("ngrok")) {
      const relativePath = parsed.pathname.replace(/^\/media\//, "");
      return `/api/media-proxy/${relativePath}`;
    }
  } catch {
    // URL invalide ou relative : on la laisse telle quelle
  }

  return url;
}

function MessageMedia({ message }: { message: Message }) {
  if (!message.media_url) return null;

  const proxiedUrl = toProxiedMediaUrl(message.media_url);

  switch (message.message_type) {
    case "IMAGE":
    case "PRODUCT":
      return (
        <a href={message.media_url} target="_blank" rel="noopener noreferrer">
          <img
            src={proxiedUrl ?? undefined}
            alt="Image envoyée"
            className="mb-2 max-h-64 max-w-full rounded-xl object-cover"
          />
        </a>
      );

    case "VIDEO":
      return (
        <video
          src={proxiedUrl ?? undefined}
          controls
          preload="metadata"
          className="mb-2 max-h-64 max-w-full rounded-xl"
        />
      );

    case "AUDIO":
      return (
        <audio
          src={proxiedUrl ?? undefined}
          controls
          preload="metadata"
          className="mb-2 w-64 max-w-full"
        />
      );

    case "DOCUMENT":
      return (
        <a
          href={message.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm hover:bg-black/30"
        >
          <FileText size={18} />
          <span className="flex-1 truncate">Document</span>
          <Download size={16} />
        </a>
      );

    default:
      return null;
  }
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  const loadSessions = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/v1/support/sessions/`);
      const data: Session[] = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Erreur chargement sessions:", err);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;

    const currentCount = selected.messages.length;

    const isNewConversation = lastMessageCountRef.current === 0;
    const hasNewMessage = currentCount > lastMessageCountRef.current;

    if (isNewConversation || hasNewMessage) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    lastMessageCountRef.current = currentCount;
  }, [selected]);

  useEffect(() => {
    lastMessageCountRef.current = 0;
  }, [selectedId]);

  const handleSend = async () => {
    if (!selected) return;

    if (pendingFiles.length > 0) {
      await handleSendMedia();
      return;
    }

    if (!draft.trim()) return;

    setSending(true);

    try {
      await apiFetch(`/api/v1/support/send-message/`, {
        method: "POST",
        body: JSON.stringify({
          session_id: selected.id,
          message: draft.trim(),
        }),
      });

      setDraft("");
      await loadSessions();
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async () => {
    if (!selected || pendingFiles.length === 0) return;

    setUploadingMedia(true);

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const formData = new FormData();
        formData.append("session_id", String(selected.id));
        formData.append("file", file);
        formData.append(
          "caption",
          i === pendingFiles.length - 1 ? draft.trim() : ""
        );

        const res = await apiFetch(`/api/v1/support/send-media/`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(
            `Échec pour "${file.name}" : ${err.error || "erreur inconnue"}`
          );
          break;
        }
      }

      setPendingFiles([]);
      setDraft("");
      await loadSessions();
    } catch (err) {
      console.error("Erreur envoi médias:", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSendProduct = async (product: { id: string }) => {
    if (!selected) return;

    try {
      const res = await apiFetch(`/api/v1/support/send-product/`, {
        method: "POST",
        body: JSON.stringify({
          session_id: selected.id,
          product_id: product.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de l'envoi du produit.");
        return;
      }

      await loadSessions();
    } catch (err) {
      console.error("Erreur envoi produit:", err);
    }
  };

  const previewFor = (m: Message) => {
    if (m.content) return m.content;

    switch (m.message_type) {
      case "IMAGE":
        return "📷 Photo";
      case "VIDEO":
        return "🎥 Vidéo";
      case "AUDIO":
        return "🎤 Message vocal";
      case "DOCUMENT":
        return "📄 Document";
      case "PRODUCT":
        return "🛍️ Fiche produit";
      default:
        return "—";
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Liste des conversations */}
     <div className="w-80 shrink-0 overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="mb-3 px-2 text-sm font-semibold text-[var(--text-secondary)]">
          Conversations WhatsApp
        </div>

        {sessions.length === 0 && (
          <div className="px-2 py-8 text-center text-sm text-[var(--text-tertiary)]">
            Aucune conversation pour le moment.
          </div>
        )}

        {sessions.map((s) => {
          const last = s.messages[s.messages.length - 1];
          const isActive = s.id === selectedId;

          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
             className={`mb-2 block w-full rounded-2xl p-3 text-left transition border ${
                isActive
                  ? "border-[var(--accent)]"
                  : "border-transparent hover:bg-[var(--accent-soft)]"
              }`}
              style={isActive ? { backgroundColor: "var(--accent-soft)" } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)]">
                  {s.client_name || s.client_phone}
                </span>

                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={
                    s.status === "HUMAN_HANDLING"
                      ? { backgroundColor: "var(--warm-soft)", color: "var(--warm)" }
                      : { backgroundColor: "var(--success-soft)", color: "var(--success)" }
                  }
                >
                  {s.status === "HUMAN_HANDLING" ? "Humain" : "IA"}
                </span>
              </div>

              <div className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                {last ? previewFor(last) : "—"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Fenêtre de conversation */}
     <div className="relative flex flex-1 flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-[var(--text-tertiary)]">
            Sélectionne une conversation à gauche.
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--border)] p-4">
              <div className="font-semibold text-[var(--text-primary)]">
                {selected.client_name || selected.client_phone}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {selected.client_phone}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {selected.messages.map((m) => {
                const isCustomer = m.direction === "INCOMING";

                return (
                  <div key={m.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                    <div
                      className="max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm"
                      style={
                        isCustomer
                          ? { backgroundColor: "var(--bg)", color: "var(--text-primary)", border: "1px solid var(--border)" }
                          : m.sender === "AGENT"
                          ? { backgroundColor: "var(--warm)", color: "#FFFFFF" }
                          : { backgroundColor: "var(--accent)", color: "#FFFFFF" }
                      }
                    >
                      <MessageMedia message={m} />
                      {m.content && <div>{m.content}</div>}
                      <div className="mt-1 text-[10px] opacity-70">
                        {m.sender === "AGENT" ? "Agent" : m.sender === "AI" ? "IA" : "Client"}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-4 pt-3">
                {pendingFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                  >
                    <Paperclip size={14} />
                    <span className="max-w-[160px] truncate">{file.name}</span>
                    <button
                      onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showProductPicker && (
              <ProductPicker onClose={() => setShowProductPicker(false)} onSend={handleSendProduct} />
            )}

            <div className="flex items-center gap-3 border-t border-[var(--border)] p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  const oversized = files.filter((f) => f.size > 16 * 1024 * 1024);
                  if (oversized.length > 0) {
                    alert(`Fichier(s) trop volumineux (max 16 Mo pour WhatsApp) : ${oversized.map((f) => f.name).join(", ")}`);
                  }
                  const validFiles = files.filter((f) => f.size <= 16 * 1024 * 1024);
                  if (validFiles.length) setPendingFiles((prev) => [...prev, ...validFiles]);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-secondary)] hover:bg-[var(--border)]"
                title="Joindre un ou plusieurs fichiers"
              >
                <Paperclip size={18} />
              </button>

              <button
                onClick={() => setShowProductPicker((prev) => !prev)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-secondary)] hover:bg-[var(--border)]"
                title="Envoyer un produit du catalogue"
              >
                <Package size={18} />
              </button>

              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  pendingFiles.length > 0
                    ? "Légende (optionnelle, appliquée au dernier fichier)..."
                    : "Répondre au client..."
                }
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />

              <button
                onClick={handleSend}
                disabled={sending || uploadingMedia || (!draft.trim() && pendingFiles.length === 0)}
                className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                {uploadingMedia ? `Envoi ${pendingFiles.length > 1 ? `(${pendingFiles.length})` : ""}...` : "Envoyer"}
              </button>
            </div>
          </>
        )}
      </div>

      {selected && (
        <CustomerPanel
          sessionId={selected.id}
          customerId={selected.customer}
          clientName={selected.client_name}
          clientPhone={selected.client_phone}
        />
      )}
    </div>
  );
}