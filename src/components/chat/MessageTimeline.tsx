"use client";

import MessageCard from "./MessageCard";

export interface Message {
  id: string;
  sender: "customer" | "agent";
  text: string;
  created_at: string;
  status?: "sent" | "delivered" | "read";
  attachments?: {
    id: string;
    type: string;
    url: string;
    filename: string;
  }[];
}

interface Props {
  messages: Message[];
}

export default function MessageTimeline({
  messages,
}: Props) {
  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center">

        <div className="text-center">

          <h2 className="text-2xl font-bold text-white">
            Aucune conversation chargée
          </h2>

          <p className="mt-3 text-slate-400">
            Sélectionnez une conversation depuis la colonne de gauche.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">

      <div className="mx-auto max-w-5xl space-y-6">

        {messages.map((message) => (
          <MessageCard
            key={message.id}
            mine={message.sender === "agent"}
            text={message.text}
            time={message.created_at}
            sender={message.sender === "agent" ? "Agent" : "Client"}
            avatar={message.sender === "agent" ? "A" : "C"}
            status={message.status ?? "read"}
          />
        ))}

      </div>

    </div>
  );
}