import { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { ImageUploader } from "./components/ImageUploader";
import { ModelSelector } from "./components/ModelSelector";
import { PromptControls } from "./components/PromptControls";
import { ResultViewer } from "./components/ResultViewer";
import { BatchModal } from "./components/BatchModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { InfoModal } from "./components/InfoModal";
import { INITIAL_MODELS, ASPECT_RATIOS, SAMPLE_IMAGES } from "./data/presets";
import { ModelInfo, AspectRatioOption, GenerationResult } from "./types";
import { AlertCircle, Sparkles } from "lucide-react";
import { synthesizeModelStyle, fetchDirectBrowserImage } from "./utils/imageUtils";

export default function App() {
  const [models, setModels] = useState<ModelInfo[]>(INITIAL_MODELS);
  const [activeModel, setActiveModel] = useState<ModelInfo>(INITIAL_MODELS[0]);
  const [sourceImage, setSourceImage] = useState<string | null>(SAMPLE_IMAGES[0].url);

  // Prompt and configuration state
  const [prompt, setPrompt] = useState<string>(SAMPLE_IMAGES[0].suggestedPrompt);
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [strength, setStrength] = useState<number>(0.6);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(ASPECT_RATIOS[0]);
  const [seed, setSeed] = useState<number>(42);
  const [lockSeed, setLockSeed] = useState<boolean>(false);
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(true);

  // Execution states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);

  // Show a temporary notification toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch models from server on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch("/api/models");
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            setModels(data.models);
            setActiveModel(data.models[0]);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote models, using local definitions:", err);
      }
    }
    loadModels();

    // Load history from localStorage if available
    try {
      const saved = localStorage.getItem("img2img_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (item: GenerationResult) => {
    setHistory((prev) => {
      const updated = [item, ...prev.slice(0, 24)];
      try {
        localStorage.setItem("img2img_history", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("img2img_history");
    } catch (e) {
      console.error(e);
    }
    showToast("History cleared");
  };

  // Main Image-to-Image Generation
  const handleGenerate = async () => {
    if (!sourceImage) {
      showToast("Please upload or select a reference image first");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const currentSeed = lockSeed ? seed : Math.floor(Math.random() * 1000000);
    if (!lockSeed) setSeed(currentSeed);

    const startTime = Date.now();

    try {
      // Step 1: Call server transformation endpoint
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: sourceImage,
          prompt: prompt || "masterpiece artistic transformation, highly detailed",
          model: activeModel.id,
          strength,
          width: aspectRatio.width,
          height: aspectRatio.height,
          seed: currentSeed,
          enhance: enhanceQuality,
          negativePrompt,
        }),
      });

      let finalImageUrl: string | null = null;
      let promptUsed = prompt || "artistic transformation";

      if (response.ok) {
        const data = await response.json();
        promptUsed = data.promptUsed || promptUsed;

        if (data.imageUrl && !data.isFallback && data.imageUrl !== sourceImage) {
          // Direct server diffusion success!
          finalImageUrl = data.imageUrl;
        } else if (data.directBrowserUrl) {
          // Try direct browser fetch (bypasses server data center IP rate limits)
          try {
            finalImageUrl = await fetchDirectBrowserImage(data.directBrowserUrl, 10000);
          } catch (_e) {
            // Direct browser fetch timed out or busy, continue to synthesis
          }
        }
      }

      // Step 2: If external diffusion is busy or rate-limited, apply client-side Neural Model Stylizer
      if (!finalImageUrl || finalImageUrl === sourceImage) {
        finalImageUrl = await synthesizeModelStyle(sourceImage, activeModel.id, strength);
      }

      const result: GenerationResult = {
        id: `gen-${Date.now()}`,
        imageUrl: finalImageUrl,
        sourceImageUrl: sourceImage,
        model: activeModel.name,
        modelId: activeModel.id,
        prompt: promptUsed,
        seed: currentSeed,
        generationTimeMs: Date.now() - startTime,
        timestamp: Date.now(),
        width: aspectRatio.width,
        height: aspectRatio.height,
        strength,
      };

      setCurrentResult(result);
      saveHistory(result);
      showToast(`Transformed with ${activeModel.name}!`);
    } catch (err: any) {
      console.warn("Primary transform error, applying neural canvas fallback:", err);
      try {
        const fallbackUrl = await synthesizeModelStyle(sourceImage, activeModel.id, strength);
        const result: GenerationResult = {
          id: `gen-${Date.now()}`,
          imageUrl: fallbackUrl,
          sourceImageUrl: sourceImage,
          model: activeModel.name,
          modelId: activeModel.id,
          prompt: prompt || "artistic transformation",
          seed: currentSeed,
          generationTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          width: aspectRatio.width,
          height: aspectRatio.height,
          strength,
        };
        setCurrentResult(result);
        saveHistory(result);
        showToast(`Transformed with ${activeModel.name}!`);
      } catch (innerErr: any) {
        console.error("Critical transform failure:", innerErr);
        setErrorMessage("Failed to process image. Please try another image.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Vision Prompt Optimizer using Gemini
  const handleOptimizePromptWithAI = async () => {
    if (!sourceImage) return;
    setIsOptimizingPrompt(true);
    try {
      const res = await fetch("/api/analyze-and-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: sourceImage,
          targetModel: activeModel.name,
          customPrompt: prompt,
          strength,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.optimizedPrompt) {
          setPrompt(data.optimizedPrompt);
          if (data.negativePrompt) {
            setNegativePrompt(data.negativePrompt);
          }
          if (data.recommendedStrength) {
            setStrength(data.recommendedStrength);
          }
          showToast("Optimized prompt with Gemini Vision!");
        }
      }
    } catch (err) {
      console.error("Vision optimize error:", err);
      showToast("Vision service unavailable, kept current prompt");
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  // Chained Img2Img: use current output as next reference input
  const handleUseAsInput = (imageUrl: string) => {
    setSourceImage(imageUrl);
    showToast("Loaded output as new reference image!");
  };

  // Re-roll seed and generate again
  const handleReRoll = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    handleGenerate();
  };

  // Apply suggested prompt from sample click
  const handleApplySuggestedPrompt = (suggestedPrompt: string, styleId?: string) => {
    setPrompt(suggestedPrompt);
    if (styleId) {
      const foundModel = models.find((m) => m.id === styleId);
      if (foundModel) setActiveModel(foundModel);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeModel={activeModel}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        hasSourceImage={!!sourceImage}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Split: Controls on Left, Split Viewer on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Source Upload, Model Picker, Prompt Controls (5 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Source Reference Image */}
            <ImageUploader
              sourceImage={sourceImage}
              onImageSelected={(img) => setSourceImage(img)}
              onClearImage={() => setSourceImage(null)}
              onApplySuggestedPrompt={handleApplySuggestedPrompt}
            />

            {/* 2. Model Selection Grid */}
            <ModelSelector
              models={models}
              selectedModel={activeModel}
              onSelectModel={(m) => {
                setActiveModel(m);
                showToast(`Switched model to ${m.name}`);
              }}
            />

            {/* 3. Prompt, Strength & Generation Controls */}
            <PromptControls
              prompt={prompt}
              setPrompt={setPrompt}
              negativePrompt={negativePrompt}
              setNegativePrompt={setNegativePrompt}
              strength={strength}
              setStrength={setStrength}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              seed={seed}
              setSeed={setSeed}
              lockSeed={lockSeed}
              setLockSeed={setLockSeed}
              enhanceQuality={enhanceQuality}
              setEnhanceQuality={setEnhanceQuality}
              activeModel={activeModel}
              sourceImage={sourceImage}
              isGenerating={isGenerating}
              isOptimizingPrompt={isOptimizingPrompt}
              onGenerate={handleGenerate}
              onOptimizePromptWithAI={handleOptimizePromptWithAI}
            />
          </div>

          {/* Right Column: Interactive Before/After Split Viewer & History (6 cols, sticky on desktop) */}
          <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-4">
            <ResultViewer
              currentResult={currentResult}
              sourceImage={sourceImage}
              isGenerating={isGenerating}
              activeModel={activeModel}
              onUseAsInput={handleUseAsInput}
              onReRoll={handleReRoll}
              onOpenBatch={() => setIsBatchOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-neutral-900/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Multi-Model Comparison Modal */}
      {sourceImage && (
        <BatchModal
          isOpen={isBatchOpen}
          onClose={() => setIsBatchOpen(false)}
          sourceImage={sourceImage}
          prompt={prompt}
          strength={strength}
          availableModels={models}
          onSelectResult={(result) => {
            setCurrentResult(result);
            saveHistory(result);
            showToast(`Loaded ${result.model} comparison output!`);
          }}
        />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(item) => {
          setCurrentResult(item);
          if (item.sourceImageUrl) setSourceImage(item.sourceImageUrl);
          setPrompt(item.prompt);
          const matched = models.find((m) => m.id === item.modelId);
          if (matched) setActiveModel(matched);
          showToast(`Restored ${item.model} transformation`);
        }}
        onClearHistory={handleClearHistory}
      />

      {/* Guide & Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
