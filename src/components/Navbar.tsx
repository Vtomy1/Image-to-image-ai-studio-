import { Sparkles, Layers, History, HelpCircle, Zap, ShieldCheck } from "lucide-react";
import { ModelInfo } from "../types";

interface NavbarProps {
  activeModel: ModelInfo;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenInfo: () => void;
  onOpenBatch: () => void;
  hasSourceImage: boolean;
}

export function Navbar({
  activeModel,
  historyCount,
  onOpenHistory,
  onOpenInfo,
  onOpenBatch,
  hasSourceImage,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Image to Image
              </span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                Studio
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Multi-model AI diffusion transformation • Free & Unlimited
            </p>
          </div>
        </div>

        {/* Status Pill & Model info */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>All Models Online • Free & Unlimited</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs text-neutral-300">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-neutral-400">Active:</span>
            <span className="font-medium text-white">{activeModel.name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasSourceImage && (
            <button
              id="batch-compare-nav-btn"
              onClick={onOpenBatch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
              title="Compare output across 4 models simultaneously"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Compare 4 Models</span>
              <span className="sm:hidden">Compare</span>
            </button>
          )}

          <button
            id="history-toggle-btn"
            onClick={onOpenHistory}
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-neutral-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                {historyCount}
              </span>
            )}
          </button>

          <button
            id="info-toggle-btn"
            onClick={onOpenInfo}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Guide & Free Model Information"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
