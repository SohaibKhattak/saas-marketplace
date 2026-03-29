"use client";

import { useRef, useEffect } from "react";
import {
  Terminal,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
} from "lucide-react";

export interface ConsoleMessage {
  id: string;
  type: "info" | "error" | "warn" | "success" | "system";
  message: string;
  timestamp: Date;
}

interface TerminalPanelProps {
  messages: ConsoleMessage[];
  onClear: () => void;
}

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/5",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/5",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-500/5",
  },
  system: {
    icon: Terminal,
    color: "text-purple-400",
    bg: "bg-purple-500/5",
  },
};

export function TerminalPanel({ messages, onClear }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Console
          </span>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <button
          className="p-1 hover:bg-accent rounded transition-colors"
          onClick={onClear}
          title="Clear console"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-0.5 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground/50">
            <div className="text-center">
              <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Console output will appear here</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const config = typeConfig[msg.type];
            const Icon = config.icon;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 px-2 py-1 rounded ${config.bg} animate-fade-in`}
              >
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
                <span className="text-muted-foreground/60 shrink-0">
                  {msg.timestamp.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className={`${config.color} whitespace-pre-wrap break-all`}>
                  {msg.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
