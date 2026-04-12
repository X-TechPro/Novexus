"use client";

import { useState } from "react";
import { ChevronDown, Wrench, Search, Calculator, Clock, FileText, Terminal, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallBlockProps {
  toolName: string;
  args?: any;
  result?: string;
}

const TOOL_ICONS: Record<string, any> = {
  search: Search,
  calculate: Calculator,
  clock: Clock,
  files: FileText,
  run_command: Terminal,
  memories: Brain,
};

export function ToolCallBlock({ toolName, args, result }: ToolCallBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = TOOL_ICONS[toolName] || Wrench;

  const displayName = toolName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border bg-primary/5 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-primary/10"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="flex-1 text-xs font-semibold text-primary/90">
          Tool called: <span className="text-foreground">{displayName}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-primary/40 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-primary/10 px-4 py-3 bg-primary/5">
            {args && Object.keys(args).length > 0 && (
              <div className="mb-3">
                 <p className="text-[9px] uppercase tracking-widest text-primary/40 font-bold mb-1.5 px-1">Arguments</p>
                 <pre className="text-[11px] text-primary/80 bg-background/50 p-2.5 rounded-lg overflow-x-auto border border-primary/5 font-mono leading-relaxed">
                   {JSON.stringify(args, null, 2)}
                 </pre>
              </div>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-primary/40 font-bold mb-1.5 px-1">Result</p>
              <div className="text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap bg-background/30 p-2.5 rounded-lg border border-primary/5">
                {result || "No output returned."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
