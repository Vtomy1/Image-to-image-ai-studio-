import { useState } from "react";
import {
  Zap,
  Sparkles,
  Camera,
  Smile,
  Box,
  Flame,
  Cpu,
  Terminal,
  Palette,
  Gamepad2,
  Droplets,
  Check,
  ShieldCheck,
} from "lucide-react";
import { ModelInfo } from "../types";

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
}

const CATEGORIES = ["All", "General", "Realistic", "Stylized", "Artistic", "Speed", "Retro"] as const;

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
}: ModelSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredModels =
    activeCategory === "All"
      ? models
      : models.filter((m) => m.category === activeCategory);

  const getModelIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="h-4 w-4 text-amber-400" />;
      case "Sparkles":
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case "Camera":
        return <Camera className="h-4 w-4 text-cyan-400" />;
      case "Smile":
        return <Smile className="h-4 w-4 text-pink-400" />;
      case "Box":
        return <Box className="h-4 w-4 text-emerald-400" />;
      case "Flame":
        return <Flame className="h-4 w-4 text-orange-400" />;
      case "Cpu":
        return <Cpu className="h-4 w-4 text-blue-400" />;
      case "Terminal":
        return <Terminal className="h-4 w-4 text-lime-400" />;
      case "Palette":
        return <Palette className="h-4 w-4 text-yellow-400" />;
      case "Gamepad2":
        return <Gamepad2 className="h-4 w-4 text-indigo-400" />;
      case "Droplets":
        return <Droplets className="h-4 w-4 text-teal-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-neutral-200">
            Select Diffusion Model
          </h2>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <ShieldCheck className="h-2.5 w-2.5" />
            100% Free & Unlimited
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/60"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
        {filteredModels.map((model) => {
          const isSelected = selectedModel.id === model.id;
          return (
            <button
              key={model.id}
              type="button"
              id={`model-card-${model.id}`}
              onClick={() => onSelectModel(model)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 shadow-sm">
                      {getModelIcon(model.icon)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {model.name}
                      </h3>
                      <span className="text-[10px] text-neutral-400">
                        {model.speed}
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-neutral-800/80 border border-neutral-700/60 px-2 py-0.5 text-[9px] font-medium text-neutral-300">
                    {model.badge}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mt-1">
                  {model.description}
                </p>
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-neutral-800/60 text-[10px]">
                <span className="text-neutral-400 font-mono">
                  {model.qualityTag}
                </span>

                {isSelected ? (
                  <span className="flex items-center gap-1 font-semibold text-indigo-400">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="text-neutral-400 group-hover:text-neutral-200">
                    Select &rarr;
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
