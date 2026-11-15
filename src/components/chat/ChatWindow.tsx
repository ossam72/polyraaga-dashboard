"use client";

import ConversationHeader, {
  CustomerHeader,
} from "@/components/inbox/ConversationHeader";

import { Paperclip, Smile, SendHorizontal } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "customer" | "agent" | "ai";

  text: string;

  createdAt: string;

  status?: "sent" | "delivered" | "read";
}

interface Props {
  customer: CustomerHeader;

  messages: ChatMessage[];

  onSend?: (message: string) => void;
}

export default function ChatWindow({
  customer,
  messages,
  onSend,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-[#020817]">

      <ConversationHeader customer={customer} />

      <div className="flex-1 overflow-y-auto px-8 py-8">

        <div className="space-y-5">

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "customer"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`max-w-2xl rounded-3xl px-5 py-4 shadow-xl ${
                  message.sender === "customer"
                    ? "rounded-bl-md bg-slate-800 text-white"
                    : message.sender === "agent"
                    ? "rounded-br-md bg-cyan-600 text-white"
                    : "rounded-br-md border border-violet-500/30 bg-violet-900/40 text-violet-100"
                }`}
              >
                <p className="whitespace-pre-wrap text-[15px] leading-7">
                  {message.text}
                </p>

                <div className="mt-3 text-right text-xs opacity-70">
                  {message.createdAt}
                </div>
              </div>
            </div>
          ))}

        </div>

      </div>

      <div className="border-t border-slate-800 bg-slate-950 px-6 py-5">

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">

          <textarea
            placeholder="Répondre au client..."
            rows={4}
            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-slate-500"
          />

          <div className="mt-4 flex items-center justify-between">

            <div className="flex gap-3">

              <button className="rounded-xl bg-slate-800 p-3 hover:bg-slate-700">
                <Paperclip size={18} />
              </button>

              <button className="rounded-xl bg-slate-800 p-3 hover:bg-slate-700">
                <Smile size={18} />
              </button>

            </div>

            <button
              onClick={() => onSend?.("")}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-500"
            >
              Envoyer

              <SendHorizontal size={18} />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}