"use client";

import CountUp from "react-countup";
import { ArrowUpRight } from "lucide-react";

interface Props {
  title: string;
  value: string;
  suffix?: string;
  growth: string;
  color: string;
}

export default function StatCard({
  title,
  value,
 suffix,
  growth,
  color,
}: Props) {
  return (
    <div
      className="
      group
      overflow-hidden
      rounded-3xl
      border
      border-white/10
      bg-white/5
      p-6
      backdrop-blur-xl
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-cyan-400/40
      hover:shadow-[0_0_60px_rgba(0,200,255,.15)]
    "
    >
      <div
        className={`mb-5 h-2 rounded-full bg-gradient-to-r ${color}`}
      />

      <div className="text-slate-400">{title}</div>

      <div className="mt-4 flex items-end justify-between">

        <div className="text-5xl font-black">

          <CountUp
            end={Number(value)}
            duration={2}
          />

          {suffix}

        </div>

        <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-400">

          <ArrowUpRight size={16} />

          {growth}

        </div>

      </div>

    </div>
  );
}