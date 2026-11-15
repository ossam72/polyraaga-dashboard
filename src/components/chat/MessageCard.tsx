"use client";

import {
  Check,
  CheckCheck,
  Clock3,
  Paperclip,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

interface Props {
  mine?: boolean;
  text: string;
  time: string;
  sender: string;
  avatar: string;
  status?: "sent" | "delivered" | "read";
  attachment?: {
    type: "image" | "file";
    name: string;
    size?: string;
  };
}

export default function MessageCard({
  mine = false,
  text,
  sender,
  avatar,
  time,
  status = "read",
  attachment,
}: Props) {
  return (
    <div
      className={`flex w-full ${
        mine ? "justify-end" : "justify-start"
      } mb-8`}
    >
      {!mine && (
        <img
          src={avatar}
          alt={sender}
          className="mr-4 h-11 w-11 rounded-full object-cover"
        />
      )}

      <div className={`max-w-[72%] ${mine ? "order-1" : ""}`}>
        {!mine && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {sender}
          </p>
        )}

        <div
          className={`rounded-3xl px-6 py-5 shadow-xl transition-all duration-300 ${
            mine
              ? "rounded-br-lg bg-cyan-600 text-white"
              : "rounded-bl-lg border border-slate-700 bg-slate-800 text-slate-100"
          }`}
        >
          {attachment && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                {attachment.type === "image" ? (
                  <ImageIcon size={22} />
                ) : (
                  <FileText size={22} />
                )}

                <div>
                  <div className="font-semibold">
                    {attachment.name}
                  </div>

                  {attachment.size && (
                    <div className="text-xs opacity-70">
                      {attachment.size}
                    </div>
                  )}
                </div>

                <Paperclip className="ml-auto" size={18} />
              </div>
            </div>
          )}

          <div className="whitespace-pre-line text-[15px] leading-7">
            {text}
          </div>

          <div
            className={`mt-5 flex items-center justify-end gap-2 text-xs ${
              mine ? "text-cyan-100" : "text-slate-400"
            }`}
          >
            <Clock3 size={13} />

            {time}

            {mine && (
              <>
                {status === "sent" && <Check size={15} />}

                {status === "delivered" && (
                  <CheckCheck size={15} />
                )}

                {status === "read" && (
                  <CheckCheck
                    size={15}
                    className="text-sky-300"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {mine && (
        <img
          src={avatar}
          alt=""
          className="ml-4 h-11 w-11 rounded-full object-cover"
        />
      )}
    </div>
  );
}