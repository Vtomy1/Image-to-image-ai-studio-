import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import {
  Upload,
  Camera,
  SlidersHorizontal,
  X,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { SAMPLE_IMAGES } from "../data/presets";
import { SampleImage, CanvasFilterSettings } from "../types";
import { readFileAsDataURL, applyCanvasFilters, DEFAULT_CANVAS_FILTERS } from "../utils/imageUtils";

interface ImageUploaderProps {
  sourceImage: string | null;
  onImageSelected: (imageDataUrl: string) => void;
  onClearImage: () => void;
  onApplySuggestedPrompt: (prompt: string, styleId?: string) => void;
}

export function ImageUploader({
  sourceImage,
  onImageSelected,
  onClearImage,
  onApplySuggestedPrompt,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CanvasFilterSettings>(DEFAULT_CANVAS_FILTERS);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Global paste handler: users can press Ctrl+V anywhere to paste an image!
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const dataUrl = await readFileAsDataURL(file);
            onImageSelected(dataUrl);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onImageSelected]);

  // Handle Drag and Drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const dataUrl = await readFileAsDataURL(file);
        onImageSelected(dataUrl);
      }
    }
  };

  // Handle File Input
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await readFileAsDataURL(file);
      onImageSelected(dataUrl);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera not found.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError(null);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      onImageSelected(dataUrl);
      stopCamera();
    }
  };

  // Select Sample Image
  const handleSelectSample = (sample: SampleImage) => {
    onImageSelected(sample.url);
    onApplySuggestedPrompt(sample.suggestedPrompt, sample.suggestedStyle);
  };

  // Apply visual adjustments to current source image
  const handleFilterUpdate = async (newFilters: CanvasFilterSettings) => {
    setFilters(newFilters);
    if (!sourceImage) return;
    setIsApplyingFilter(true);
    try {
      const filtered = await applyCanvasFilters(sourceImage, newFilters);
      onImageSelected(filtered);
    } catch (err) {
      console.error("Failed to apply filter:", err);
    } finally {
      setIsApplyingFilter(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-neutral-200">
            Source Image
          </h2>
          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">
            Input Reference
          </span>
        </div>

        {sourceImage && (
          <div className="flex items-center gap-1.5">
            <button
              id="open-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                showFilters
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
              title="Pre-adjust image with canvas filters"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span className="hidden sm:inline">Pre-filter</span>
            </button>

            <button
              id="clear-source-image-btn"
              onClick={onClearImage}
              className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
              title="Remove image"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Dropzone / Image Preview */}
      {sourceImage ? (
        <div className="space-y-3">
          <div className="relative group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 aspect-video flex items-center justify-center">
            <img
              src={sourceImage}
              alt="Source reference"
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
            {isApplyingFilter && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-black/70 backdrop-blur-md p-1.5 text-xs text-white hover:bg-black"
                title="Change image"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Pre-filter Drawer */}
          {showFilters && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-medium text-neutral-300">
                <span>Canvas Pre-Processing Filters</span>
                <button
                  onClick={() => handleFilterUpdate(DEFAULT_CANVAS_FILTERS)}
                  className="text-neutral-500 hover:text-neutral-300"
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 flex justify-between">
                    <span>Brightness</span>
                    <span>{filters.brightness}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={filters.brightness}
                    onChange={(e) =>
                      handleFilterUpdate({
                        ...filters,
                        brightness: Number(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 flex justify-between">
                    <span>Contrast</span>
                    <span>{filters.contrast}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={filters.contrast}
                    onChange={(e) =>
                      handleFilterUpdate({
                        ...filters,
                        contrast: Number(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 flex justify-between">
                    <span>Saturation</span>
                    <span>{filters.saturation}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.saturation}
                    onChange={(e) =>
                      handleFilterUpdate({
                        ...filters,
                        saturation: Number(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-800/80">
                <button
                  onClick={() =>
                    handleFilterUpdate({
                      ...filters,
                      grayscale: !filters.grayscale,
                    })
                  }
                  className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                    filters.grayscale
                      ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                  }`}
                >
                  B&W Grayscale
                </button>
                <button
                  onClick={() =>
                    handleFilterUpdate({
                      ...filters,
                      sketch: !filters.sketch,
                    })
                  }
                  className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                    filters.sketch
                      ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                  }`}
                >
                  Edge Sketch Lineart
                </button>
                <button
                  onClick={() =>
                    handleFilterUpdate({
                      ...filters,
                      invert: !filters.invert,
                    })
                  }
                  className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                    filters.invert
                      ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                  }`}
                >
                  Invert
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload State */
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
              : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-900/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800/80 border border-neutral-700 text-indigo-400 mb-3 shadow-inner">
            <Upload className="h-6 w-6" />
          </div>

          <p className="text-sm font-medium text-neutral-200">
            Drag & drop your reference image here
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            or <span className="text-indigo-400 underline underline-offset-2">browse file</span> • paste from clipboard (Ctrl+V)
          </p>
          <p className="text-[11px] text-neutral-400 mt-2">
            PNG, JPG, or WEBP up to 25MB
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              id="camera-capture-trigger"
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-neutral-400" />
              <span>Use Webcam</span>
            </button>
          </div>
        </div>
      )}

      {/* Sample Reference Inspiration Gallery */}
      <div className="mt-4 pt-3 border-t border-neutral-800/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Or try with instant sample reference:</span>
          </span>
          <span className="text-[11px] text-neutral-400">1-click test</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SAMPLE_IMAGES.map((sample) => {
            const isSelected = sourceImage === sample.url;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`group relative aspect-square overflow-hidden rounded-lg border transition-all text-left ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/40"
                    : "border-neutral-800 hover:border-neutral-600 opacity-80 hover:opacity-100"
                }`}
                title={`${sample.title} - ${sample.suggestedPrompt}`}
              >
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1">
                  <p className="text-[10px] font-medium text-white truncate text-center">
                    {sample.title}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 rounded-full bg-indigo-500 p-0.5 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Webcam Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-400" />
                Capture with Webcam
              </h3>
              <button
                onClick={stopCamera}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-xs text-rose-300">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-neutral-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </button>
              {!cameraError && (
                <button
                  type="button"
                  id="snap-photo-btn"
                  onClick={capturePhoto}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 flex items-center gap-1.5 shadow-lg shadow-indigo-500/30"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Take Snapshot
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
