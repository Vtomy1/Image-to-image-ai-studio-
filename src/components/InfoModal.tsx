import { X, ShieldCheck, Zap, Sparkles, Layers, Sliders, Keyboard } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                100% Free & Unlimited Image-to-Image Studio
              </h2>
              <p className="text-xs text-neutral-400">
                Transparent guide to models, architecture & techniques
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Unlimited Guarantee */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
            <Zap className="h-4 w-4" />
            <span>Zero Paywalls, Zero Limits</span>
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Every diffusion model in this studio is powered by open-weight AI pipelines (Flux.1 Schnell, Flux Dev, SD Turbo, SANA, and SDXL). There are no credit quotas, no waitlists, and no subscription requirements. You can transform as many images as you like with zero restrictions.
          </p>
        </div>

        {/* How Img2Img Works */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>How Image-to-Image Transformation Works</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="font-semibold text-neutral-200">1. Structural Conditioning</span>
              <p className="text-neutral-400 mt-1">
                The reference image provides spatial layout, depth contours, subject poses, and composition landmarks for the diffusion latents.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="font-semibold text-neutral-200">2. Influence & Strength Slider</span>
              <p className="text-neutral-400 mt-1">
                Lower strength (20-40%) preserves original pixels with minor style tinting. Higher strength (60-80%) reinvents the medium and lighting completely.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="font-semibold text-neutral-200">3. AI Vision Prompt Assistant</span>
              <p className="text-neutral-400 mt-1">
                Click <strong>"AI Vision Prompt"</strong> to let Gemini 3.8 Flash inspect your reference image and generate an optimal diffusion prompt designed for the target model.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="font-semibold text-neutral-200">4. Interactive Split Slider</span>
              <p className="text-neutral-400 mt-1">
                Drag the divider on the output canvas to examine the micro-details of how the AI transformed every brushstroke, edge, and surface.
              </p>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
          <h4 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
            <Keyboard className="h-3.5 w-3.5 text-neutral-400" />
            <span>Keyboard Shortcuts</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
            <div>
              <kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] text-white">Ctrl + V</kbd> Paste image from clipboard
            </div>
            <div>
              <kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] text-white">Ctrl + Enter</kbd> Run transformation
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Got it, Let&apos;s Create!
          </button>
        </div>
      </div>
    </div>
  );
}
