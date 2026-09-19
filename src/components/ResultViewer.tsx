import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import {
  Download,
  Maximize2,
  RefreshCw,
  Sparkles,
  ArrowLeftRight,
  Columns,
  Eye,
  Zap,
  Copy,
  Check,
  X,
  Share2,
} from "lucide-react";
import { GenerationResult, ModelInfo } from "../types";
import { downloadImage } from "../utils/imageUtils";

interface ResultViewerProps {
  currentResult: GenerationResult | null;
  sourceImage: string | null;
  isGenerating: boolean;
  activeModel: ModelInfo;
  onUseAsInput: (imageUrl: string) => void;
  onReRoll: () => void;
  onOpenBatch: () => void;
}

type ViewMode = "split" | "side-by-side" | "output-only" | "original-only";

export function ResultViewer({
  currentResult,
  sourceImage,
  isGenerating,
  activeModel,
  onUseAsInput,
  onReRoll,
  onOpenBatch,
}: ResultViewerProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 to 100)
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slider drag with mouse or touch
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingSlider) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const onUp = () => setIsDraggingSlider(false);
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const handleCopyPrompt = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 flex flex-col justify-between h-full">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-neutral-200">
            Transformation Result
          </h2>
          {currentResult && (
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              {(currentResult.generationTimeMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {/* View Mode Selectors */}
        {currentResult && sourceImage && (
          <div className="flex items-center gap-1 rounded-lg bg-neutral-950 p-1 border border-neutral-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                viewMode === "split"
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Split Drag Slider"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span className="hidden sm:inline">Split Slider</span>
            </button>

            <button
              onClick={() => setViewMode("side-by-side")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Side by side comparison"
            >
              <Columns className="h-3 w-3" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>

            <button
              onClick={() => setViewMode("output-only")}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                viewMode === "output-only"
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="View Output Only"
            >
              Result
            </button>

            <button
              onClick={() => setViewMode("original-only")}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                viewMode === "original-only"
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="View Original Only"
            >
              Original
            </button>
          </div>
        )}
      </div>

      {/* Main Display Area */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[460px] rounded-xl border border-neutral-800 bg-neutral-950/80 overflow-hidden flex items-center justify-center select-none">
        {isGenerating ? (
          /* Generation Loading State */
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Transforming with {activeModel.name}...
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Generating high-fidelity diffusion latents with image conditioning and structural guidance.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <Zap className="h-3 w-3" />
              <span>Unlimited Free Generation in Progress</span>
            </div>
          </div>
        ) : currentResult ? (
          /* Active Result Display */
          viewMode === "split" && sourceImage ? (
            /* Interactive Split-Screen Slider */
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onClick={(e) => handleMove(e.clientX)}
              className="relative w-full h-full cursor-ew-resize overflow-hidden flex items-center justify-center"
            >
              {/* Before Image (Underneath, full width) */}
              <img
                src={sourceImage}
                alt="Original reference"
                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* After Image (Clipped on top by slider percentage) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                }}
              >
                <img
                  src={currentResult.imageUrl}
                  alt="Transformed result"
                  className="absolute inset-0 h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Vertical Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Center Handle Pill */}
                <div
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-900 shadow-xl border-2 border-indigo-600 pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform"
                >
                  <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
                </div>
              </div>

              {/* Labels */}
              <span className="absolute bottom-3 left-3 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white pointer-events-none z-10 border border-white/10">
                Original ({(sliderPosition).toFixed(0)}%)
              </span>
              <span className="absolute bottom-3 right-3 rounded-md bg-indigo-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white pointer-events-none z-10 shadow-lg">
                {currentResult.model} ({(100 - sliderPosition).toFixed(0)}%)
              </span>
            </div>
          ) : viewMode === "side-by-side" && sourceImage ? (
            /* Side-by-Side Comparison */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full h-full p-2">
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                <img
                  src={sourceImage}
                  alt="Original reference"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] text-white">
                  Original
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-indigo-500/30 bg-black flex items-center justify-center">
                <img
                  src={currentResult.imageUrl}
                  alt="Transformed output"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 left-2 rounded bg-indigo-600 px-2 py-0.5 text-[10px] text-white font-medium">
                  {currentResult.model}
                </span>
              </div>
            </div>
          ) : viewMode === "original-only" && sourceImage ? (
            /* Original Only */
            <img
              src={sourceImage}
              alt="Original reference"
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            /* Output Only */
            <img
              src={currentResult.imageUrl}
              alt="Transformed result"
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          )
        ) : (
          /* Empty Initial State */
          <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
              <Sparkles className="h-7 w-7 text-indigo-400/80" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-300">
                Ready for Image-to-Image Transformation
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Upload or select a reference image, choose a model and style prompt, then click Generate to see the before/after magic.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-neutral-400">
              <span className="rounded-full bg-neutral-900 px-2.5 py-1 border border-neutral-800">
                ⚡ 11+ Diffusion Models
              </span>
              <span className="rounded-full bg-neutral-900 px-2.5 py-1 border border-neutral-800">
                ✨ Free & Unlimited
              </span>
              <span className="rounded-full bg-neutral-900 px-2.5 py-1 border border-neutral-800">
                🎚️ Interactive Split Slider
              </span>
            </div>
          </div>
        )}

        {/* Top-Right Floating Actions on Generated Image */}
        {currentResult && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            <button
              onClick={() => setIsFullscreen(true)}
              className="rounded-lg bg-black/70 backdrop-blur-md border border-white/10 p-2 text-white hover:bg-black transition-colors"
              title="Fullscreen preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Controls on Result */}
      {currentResult && (
        <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                id="download-hd-btn"
                type="button"
                onClick={() =>
                  downloadImage(
                    currentResult.imageUrl,
                    `transformed-${currentResult.modelId}-${Date.now()}.png`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </button>

              <button
                id="use-as-input-btn"
                type="button"
                onClick={() => onUseAsInput(currentResult.imageUrl)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
                title="Feed this transformed image back as the source input for iterative chained styling"
              >
                <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
                <span>Use as Next Input</span>
              </button>

              <button
                type="button"
                onClick={onReRoll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
                title="Generate again with a new random seed"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Re-roll Seed</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenBatch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
              title="Run this prompt across 4 models at once"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Compare in 4 Models</span>
            </button>
          </div>

          {/* Details & Prompt Snippet */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-lg bg-neutral-950 p-2.5 text-xs text-neutral-400 border border-neutral-800/80">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-neutral-300">Prompt:</span>
              <span className="truncate text-neutral-400 max-w-xs sm:max-w-md">
                {currentResult.prompt}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[11px] text-neutral-400">
                Seed: {currentResult.seed}
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 text-neutral-400 hover:text-white"
                title="Copy prompt"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && currentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 rounded-full bg-neutral-900 border border-neutral-700 p-2 text-white hover:bg-neutral-800 z-50"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={currentResult.imageUrl}
            alt="Transformed fullscreen"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}
