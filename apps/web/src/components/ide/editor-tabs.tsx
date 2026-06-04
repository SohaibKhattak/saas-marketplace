"use client";

import { X, Circle } from "lucide-react";

export interface TabInfo {
  id: string;
  name: string;
  path: string;
  isDirty: boolean;
}

interface EditorTabsProps {
  tabs: TabInfo[];
  activeTab: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

// File icon color based on extension
function getTabDot(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = {
    tsx: "bg-blue-400",
    ts: "bg-white0",
    jsx: "bg-yellow-400",
    js: "bg-yellow-500",
    css: "bg-pink-400",
    html: "bg-orange-400",
    json: "bg-yellow-300",
    md: "bg-gray-400",
    prisma: "bg-teal-400",
  };
  return colors[ext || ""] || "bg-gray-400";
}

export function EditorTabs({ tabs, activeTab, onTabClick, onTabClose }: EditorTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-background border-b border-border overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-r border-border min-w-0 group transition-colors ${
              isActive
                ? "bg-card text-foreground border-b-2 border-b-primary"
                : "text-gray-500 hover:bg-accent/50"
            }`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className={`h-2 w-2 rounded-sm shrink-0 ${getTabDot(tab.name)}`} />
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.isDirty && (
              <Circle className="h-2 w-2 fill-current text-neutral-900 shrink-0" />
            )}
            <button
              className="ml-1 p-0.5 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
