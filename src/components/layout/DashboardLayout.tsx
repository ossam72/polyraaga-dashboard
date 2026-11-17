"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { CopilotProvider } from "@/context/CopilotContext";
import AICopilotModal from "@/components/copilot/AICopilotModal";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <CopilotProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full p-6 sm:p-8">{children}</div>
          </main>
        </div>
      </div>
      <AICopilotModal />
    </CopilotProvider>
  );
}
