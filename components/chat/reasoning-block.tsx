"use client";

import { useState } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningBlockProps {
  thinking: string;
}

export function ReasoningBlock({ thinking }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-border bg-[oklch(0.14_0.006_260)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-[oklch(0.16_0.007_260)]"
      >
        <Brain className="h-4 w-4 text-muted-foreground/70" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">
          Reasoning
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
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
          <div className="border-t border-border px-4 py-3">
            <div className="text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {thinking}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
