"use client";

import {
  Phone,
  Video,
  Bot,
  ShoppingCart,
  BookOpen,
  MoreHorizontal,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

export interface CustomerHeader {
  id: string;
  fullName: string;
  avatar: string;
  phone: string;
  online: boolean;

  loyaltyLevel: string;
  totalOrders: number;
  lifetimeValue: number;

  city: string;
  country: string;

  language: string;

  lastSeen: string;

  assignedAgent: string;
}

interface Props {
  customer: CustomerHeader;

  onOpenCatalog?: () => void;
  onCreateOrder?: () => void;
  onOpenAI?: () => void;
}

export default function ConversationHeader({
  customer,
  onCreateOrder,
  onOpenCatalog,
  onOpenAI,
}: Props) {
  return (
    <header className="border-b border-slate-800 bg-slate-950">

      <div className="flex items-center justify-between px-8 py-6">

        <div className="flex items-center gap-5">

          <img
            src={customer.avatar}
            alt={customer.fullName}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-cyan-500"
          />

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-2xl font-bold text-white">
                {customer.fullName}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${customer.online
                  ? "bg-green-500/20 text-green-400"
                  : "bg-slate-700 text-slate-300"
                  }`}
              >
                {customer.online ? "En ligne" : "Hors ligne"}
              </span>

              <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                {customer.loyaltyLevel}
              </span>

            </div>

            <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-slate-400">

              <span>{customer.phone}</span>

              <span>
                {customer.totalOrders.toLocaleString()} commandes
              </span>

              <span>
                {customer.lifetimeValue.toLocaleString()} FCFA
              </span>

              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {customer.city}, {customer.country}
              </span>

              <span>{customer.language}</span>

            </div>

            <div className="mt-2 flex flex-wrap gap-6 text-xs text-slate-500">

              <span className="flex items-center gap-1">
                <Clock size={13} />
                {customer.lastSeen}
              </span>

              <span className="flex items-center gap-1">
                <ShieldCheck size={13} />
                Agent : {customer.assignedAgent}
              </span>

            </div>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <button className="rounded-xl bg-slate-900 p-3 transition hover:bg-slate-800">
            <Phone size={18} />
          </button>

          <button className="rounded-xl bg-slate-900 p-3 transition hover:bg-slate-800">
            <Video size={18} />
          </button>

          <button
            onClick={onOpenCatalog}
            className="rounded-xl bg-cyan-600 px-4 py-3 text-white transition hover:bg-cyan-500"
          >
            <BookOpen size={18} />
          </button>

          <button
            onClick={onCreateOrder}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-white transition hover:bg-indigo-500"
          >
            <ShoppingCart size={18} />
          </button>

          <button
            onClick={onOpenAI}
            className="rounded-xl bg-violet-600 px-4 py-3 text-white transition hover:bg-violet-500"
          >
            <Bot size={18} />
          </button>

          <button className="rounded-xl bg-slate-900 p-3 transition hover:bg-slate-800">
            <MoreHorizontal size={18} />
          </button>

        </div>

      </div>

    </header>
  );
}