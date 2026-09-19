import { useState } from "react";
import {
  Wand2,
  Dice5,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Layers,
  Ratio,
  Maximize2,
  Lock,
  Unlock,
} from "lucide-react";
import { STYLE_PRESETS, ASPECT_RATIOS } from "../data/presets";
import { StylePreset, AspectRatioOption, ModelInfo } from "../types";

interface PromptControlsProps {
  prompt: string;
  setPrompt: (p: string) => void;
  negativePrompt: string;
  setNegativePrompt: (p: string) => void;
  strength: number;
  setStrength: (s: number) => void;
  aspectRatio: AspectRatioOption;
  setAspectRatio: (ar: AspectRatioOption) => void;
  seed: number;
  setSeed: (seed: number) => void;
  lockSeed: boolean;
  setLockSeed: (locked: boolean) => void;
  enhanceQuality: boolean;
  setEnhanceQuality: (val: boolean) => void;
  activeModel: ModelInfo;
  sourceImage: string | null;
  isGenerating: boolean;
  isOptimizingPrompt: boolean;
  onGenerate: () => void;
  onOptimizePromptWithAI: () => void;
}

export function PromptControls({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  strength,
  setStrength,
  aspectRatio,
  setAspectRatio,
  seed,
  setSeed,
  lockSeed,
  setLockSeed,
  enhanceQuality,
  setEnhanceQuality,
  activeModel,
  sourceImage,
  isGenerating,
  isOptimizingPrompt,
  onGenerate,
  onOptimizePromptWithAI,
}: PromptControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  const rollSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handleApplyStyle = (style: StylePreset) => {
    setSelectedStyleId(style.id);
    if (!prompt.trim()) {
      setPrompt(style.prompt);
    } else if (!prompt.includes(style.prompt)) {
      setPrompt(`${prompt.trim()}, ${style.prompt}`);
    }
    if (style.strengthRecommendation) {
      setStrength(style.strengthRecommendation);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-neutral-200">
            Prompt & Transformation Guidance
          </h2>
        </div>

        {sourceImage && (
          <button
            id="gemini-vision-optimize-btn"
            type="button"
            onClick={onOptimizePromptWithAI}
            disabled={isOptimizingPrompt || isGenerating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
            title="Use Gemini Vision to analyze image and generate an optimal diffusion prompt"
          >
            <Sparkles className={`h-3.5 w-3.5 text-indigo-400 ${isOptimizingPrompt ? "animate-spin" : ""}`} />
            <span>{isOptimizingPrompt ? "Analyzing Image..." : "AI Vision Prompt"}</span>
          </button>
        )}
      </div>

      {/* Main Prompt Input */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex justify-between">
          <span>Creative Prompt (describe what you want to transform)</span>
          <span className="text-[11px] text-neutral-400">
            {prompt.length} chars
          </span>
        </label>
        <div className="relative">
          <textarea
            id="prompt-input-textarea"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                if (!isGenerating && sourceImage) onGenerate();
              }
            }}
            placeholder="e.g. Cyberpunk warrior with glowing neon visor, highly detailed 8k render, masterpiece..."
            className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Style Presets Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-neutral-400">
            Quick Style Presets
          </span>
          <span className="text-[11px] text-neutral-400">Click to append</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {STYLE_PRESETS.map((style) => {
            const isApplied = selectedStyleId === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleApplyStyle(style)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors flex items-center gap-1 ${
                  isApplied
                    ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-200"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span>{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Influence / Strength Slider */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-neutral-300">
              Image Influence & Transformation Strength
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-indigo-400">
            {Math.round(strength * 100)}%
          </span>
        </div>
        <input
          id="strength-slider"
          type="range"
          min="0.1"
          max="0.9"
          step="0.05"
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-sans">
          <span>10% (Close to Original)</span>
          <span>50% (Balanced Remix)</span>
          <span>90% (Wild Transformation)</span>
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
          <Ratio className="h-3.5 w-3.5 text-neutral-400" />
          <span>Output Aspect Ratio & Resolution</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {ASPECT_RATIOS.map((ar) => {
            const isSelected = aspectRatio.id === ar.id;
            return (
              <button
                key={ar.id}
                type="button"
                onClick={() => setAspectRatio(ar)}
                className={`flex flex-col items-center justify-center rounded-lg border py-2 px-1 text-center transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10 text-white font-medium"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span className="text-xs">{ar.label}</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {ar.width}&times;{ar.height}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings Accordion */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" />
            <span>Advanced Controls (Seed, Quality Boost, Negative Prompt)</span>
          </span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-2 space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 animate-in fade-in duration-150">
            {/* Seed Controller */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                <span>Random Seed:</span>
                <span className="font-mono text-xs text-indigo-400">{seed}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={rollSeed}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
                  title="Randomize seed"
                >
                  <Dice5 className="h-3.5 w-3.5" />
                  <span>Roll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLockSeed(!lockSeed)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                    lockSeed
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                      : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                  title={lockSeed ? "Seed locked" : "Seed unlocked (randomizes each turn)"}
                >
                  {lockSeed ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  <span>{lockSeed ? "Locked" : "Lock"}</span>
                </button>
              </div>
            </div>

            {/* Quality Boost Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-300 font-medium">Quality Enhancer Tokens</span>
                <p className="text-[11px] text-neutral-400">
                  Appends masterwork, high-definition fidelity tags automatically
                </p>
              </div>
              <input
                type="checkbox"
                checked={enhanceQuality}
                onChange={(e) => setEnhanceQuality(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Negative Prompt */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Negative Prompt (what to avoid)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, distorted, low quality, bad anatomy, artifacts..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Generate Button */}
      <button
        id="generate-transform-btn"
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !sourceImage}
        className={`w-full relative flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-bold text-sm text-white shadow-xl transition-all ${
          isGenerating || !sourceImage
            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-indigo-500/25 active:scale-[0.99]"
        }`}
      >
        {isGenerating ? (
          <>
            <Zap className="h-4 w-4 animate-bounce text-amber-300" />
            <span>Transforming with {activeModel.name}...</span>
          </>
        ) : !sourceImage ? (
          <span>Select or Upload a Reference Image First</span>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate Img2Img with {activeModel.name}</span>
            <span className="hidden sm:inline text-xs font-normal opacity-70 ml-1">
              (Ctrl+Enter)
            </span>
          </>
        )}
      </button>
    </div>
  );
}
