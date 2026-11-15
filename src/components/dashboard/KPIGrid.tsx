"use client";

import StatCard from "./StatCard";
import { stats } from "@/lib/dashboard-data";

export default function KPIGrid() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {stats.map((item) => (
        <StatCard
          key={item.title}
          {...item}
        />
      ))}
    </div>
  );
}