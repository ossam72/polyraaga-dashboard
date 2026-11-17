"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CopilotContextType {
  isOpen: boolean;
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  initialPrompt: string;
  triggerPrompt: (prompt: string) => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");

  const openCopilot = () => setIsOpen(true);
  const closeCopilot = () => setIsOpen(false);
  const toggleCopilot = () => setIsOpen((prev) => !prev);

  const triggerPrompt = (prompt: string) => {
    setInitialPrompt(prompt);
    setIsOpen(true);
  };

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        openCopilot,
        closeCopilot,
        toggleCopilot,
        initialPrompt,
        triggerPrompt,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error("useCopilot must be used within a CopilotProvider");
  }
  return context;
}
