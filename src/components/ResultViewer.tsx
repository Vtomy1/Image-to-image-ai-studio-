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
  Info,
  Calendar,
  Hash,
  Cpu,
  Sliders,
  Layers,
  Clock,
  ExternalLink,
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
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleCopyValue = (fieldKey: string, value: string | number) => {
    navigator.clipboard.writeText(String(value));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1800);
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
              onClick={() => setShowDetails((prev) => !prev)}
              className={`rounded-lg backdrop-blur-md border p-2 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-md ${
                showDetails
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30"
                  : "bg-black/70 border-white/10 text-white hover:bg-black"
              }`}
              title="Toggle Image Details"
              aria-label="Image Details"
            >
              <Info className="h-3.5 w-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Details</span>
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="rounded-lg bg-black/70 backdrop-blur-md border border-white/10 p-2 text-white hover:bg-black transition-colors"
              title="Fullscreen preview"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Small Image Details Overlay Panel (embedded inside the viewer card) */}
        {showDetails && currentResult && (
          <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-84 max-h-[85%] bg-neutral-900/95 border border-neutral-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-30 p-4 flex flex-col text-xs text-neutral-300 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs">Image Details</h3>
                  <p className="text-[10px] text-neutral-400">Generation metadata & parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="rounded-md p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Model */}
              <div className="flex items-center justify-between rounded-lg bg-neutral-950/70 p-2 border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="text-neutral-400 font-medium">Model:</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span>{currentResult.model}</span>
                  <button
                    onClick={() => handleCopyValue("model", currentResult.model)}
                    className="text-neutral-400 hover:text-indigo-400 transition-colors p-0.5"
                    title="Copy model name"
                  >
                    {copiedField === "model" ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Seed */}
              <div className="flex items-center justify-between rounded-lg bg-neutral-950/70 p-2 border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="text-neutral-400 font-medium">Seed:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-amber-300">
                  <span>{currentResult.seed}</span>
                  <button
                    onClick={() => handleCopyValue("seed", currentResult.seed)}
                    className="text-neutral-400 hover:text-amber-300 transition-colors p-0.5"
                    title="Copy seed"
                  >
                    {copiedField === "seed" ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Strength */}
              <div className="flex items-center justify-between rounded-lg bg-neutral-950/70 p-2 border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-neutral-400 font-medium">Strength:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${Math.round(currentResult.strength * 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold text-white">
                    {Math.round(currentResult.strength * 100)}% ({currentResult.strength.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Generation Timestamp */}
              <div className="flex items-center justify-between rounded-lg bg-neutral-950/70 p-2 border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-neutral-400 font-medium">Timestamp:</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-neutral-200 text-[11px]">
                    {new Date(currentResult.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {new Date(currentResult.timestamp).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Execution Duration & Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-neutral-950/70 p-2 border border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                    <Clock className="h-3 w-3 text-violet-400" />
                    <span>Duration</span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-200 mt-0.5">
                    {(currentResult.generationTimeMs / 1000).toFixed(2)}s
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-950/70 p-2 border border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                    <Layers className="h-3 w-3 text-pink-400" />
                    <span>Resolution</span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-200 mt-0.5">
                    {currentResult.width || 1024} × {currentResult.height || 1024}
                  </p>
                </div>
              </div>

              {/* Prompt Box */}
              <div className="rounded-lg bg-neutral-950/70 p-2.5 border border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="font-semibold text-neutral-300">Transformation Prompt:</span>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed max-h-24 overflow-y-auto break-words bg-black/40 p-1.5 rounded border border-neutral-800/50">
                  {currentResult.prompt}
                </p>
              </div>
            </div>
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

            <div className="flex items-center gap-2">
              {/* Image Details Button in Bottom Toolbar */}
              <button
                id="image-details-btn"
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showDetails
                    ? "border-indigo-500 bg-indigo-600/20 text-indigo-200 shadow-sm"
                    : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                }`}
                title="View image details and metadata"
              >
                <Info className="h-3.5 w-3.5 text-indigo-400" />
                <span>Image Details</span>
              </button>

              <button
                type="button"
                onClick={onOpenBatch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
                title="Run this prompt across 4 models at once"
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compare 4 Models</span>
                <span className="sm:hidden">Compare</span>
              </button>
            </div>
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
