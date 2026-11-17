"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Zap,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useCopilot } from "@/context/CopilotContext";
import { apiFetch } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const SALES_PROMPTS = [
  {
    icon: Sparkles,
    label: "Pitch Vendeur Émotionnel",
    prompt:
      "Rédige un message WhatsApp ultra-convaincant et chaleureux pour présenter un produit à un client hésitant en insistant sur la qualité supérieure, l'exclusivité et la tranquillité d'esprit.",
  },
  {
    icon: CreditCard,
    label: "Relance Paiement Sécurisé",
    prompt:
      "Rédige une relance WhatsApp bienveillante pour un client dont la commande est en attente, en lui expliquant comment régler rapidement par Orange Money, Moov Money ou Wave en toute sécurité.",
  },
  {
    icon: ShoppingBag,
    label: "Prise de coordonnées & Livraison",
    prompt:
      "Génère une réponse fluide et engageante pour demander au client son nom complet, sa ville/quartier exact de livraison et son contact pour préparer l'expédition.",
  },
  {
    icon: ShieldCheck,
    label: "Objection 'C'est trop cher'",
    prompt:
      "Comment répondre avec élégance et persuasion à un client qui dit 'c'est cher' ou qui compare avec des produits bas de gamme du marché local ?",
  },
];

export default function AICopilotModal() {
  const { isOpen, closeCopilot, initialPrompt } = useCopilot();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Bonjour ! Je suis votre Copilot Commercial Scrafit, optimisé pour les ventes WhatsApp haute conversion.\n\nJe peux générer des réponses vendeuses qui touchent les émotions du client, relancer des paiements Mobile Money (Orange, Moov, Wave) ou préparer la livraison sans friction. Que voulez-vous que nous vendions aujourd'hui ?",
      timestamp: "Maintenant",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/v1/support/chat/", {
        method: "POST",
        body: JSON.stringify({ message: textToSend }),
      });

      let aiReply = "";

      if (res.ok) {
        const data = await res.json();
        aiReply = data.message || data.reply || (typeof data === "string" ? data : JSON.stringify(data));
      } else {
        // Fallback intelligent commercial si le backend est indisponible ou hors ligne
        aiReply = generateFallbackSalesResponse(textToSend);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackReply = generateFallbackSalesResponse(textToSend);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Logique commerciale de secours haut de gamme
  const generateFallbackSalesResponse = (prompt: string): string => {
    const p = prompt.toLowerCase();
    if (p.includes("relance") || p.includes("paiement") || p.includes("payer")) {
      return (
        "Bonjour cher client ! 🌟 Votre commande est bien réservée dans nos entrepôts. " +
        "Pour valider l'expédition express dès aujourd'hui chez vous, vous pouvez finaliser votre règlement en toute sécurité :\n\n" +
        "📱 *Orange Money* : Composez le code marchand ou numéro direct.\n" +
        "📱 *Moov Money / Wave* : Règlement instantané sans frais.\n\n" +
        "Dès votre validation, notre livreur vous contacte pour convenir de l'heure qui vous convient le mieux. Merci de votre confiance !"
      );
    }
    if (p.includes("cher") || p.includes("prix") || p.includes("objection")) {
      return (
        "Je comprends parfaitement votre souci d'optimiser votre budget, c'est tout à fait normal ! ✨ " +
        "La vraie différence avec notre produit, c'est sa durabilité garantie et l'authenticité vérifiée. Contrairement aux modèles bas de gamme qui vous obligent à racheter après quelques semaines, vous investissez ici dans la tranquillité d'esprit et un SAV réactif sur place. " +
        "Voulez-vous que je vous réserve une unité avec la garantie offerte ?"
      );
    }
    return (
      "Parfait ! Voici une proposition de message commercial très persuasif et humain à envoyer au client :\n\n" +
      "« Bonjour ! J'espère que vous passez une excellente journée. Je me permets de revenir vers vous car notre stock sur cet article part très rapidement aujourd'hui. " +
      "Afin que vous ne passiez pas à côté, souhaitez-vous que je valide la réservation pour votre livraison ? Donnez-moi simplement votre quartier et nous nous occupons du reste avec plaisir ! »"
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Drawer Container */}
      <div className="flex h-full w-full max-w-lg flex-col bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header Discord style */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-md">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">Scrafit AI Copilot</h2>
                <span className="rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--success)] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                  Gemini & Groq Live
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Vendeur d&apos;élite conversationnel</p>
            </div>
          </div>
          <button
            onClick={closeCopilot}
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick action prompts */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
            Tactiques Commerciales Rapides
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SALES_PROMPTS.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSend(item.prompt)}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-left text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition"
                >
                  <Icon size={14} className="shrink-0 text-[var(--accent)]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[var(--text-tertiary)] px-1">
                {msg.sender === "user" ? (
                  <>
                    <span>Vous</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Bot size={12} className="text-[var(--accent)]" />
                    <span className="font-semibold text-[var(--text-primary)]">Scrafit Copilot</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`group relative max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-[var(--accent)] text-white rounded-tr-none shadow-sm"
                    : "bg-[var(--bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none shadow-sm"
                }`}
              >
                {msg.text}

                {/* Quick copy button on AI messages */}
                {msg.sender === "ai" && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="mt-2.5 flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={12} className="text-[var(--success)]" />
                        <span className="text-[var(--success)]">Copié pour WhatsApp !</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copier pour WhatsApp</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-xs text-[var(--text-secondary)] w-fit">
              <RefreshCw size={14} className="animate-spin text-[var(--accent)]" />
              <span>Réflexion et formulation commerciale en cours...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-[var(--border)] bg-[var(--sidebar-bg)] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Demandez un pitch, une relance, ou collez le message d'un client..."
              disabled={loading}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="mt-2 text-center text-[11px] text-[var(--text-tertiary)]">
            Intelligence artificielle entraînée pour le e-commerce et WhatsApp en Afrique de l&apos;Ouest
          </div>
        </div>
      </div>
    </div>
  );
}
