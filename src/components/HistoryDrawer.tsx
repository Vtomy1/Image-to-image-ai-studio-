import { X, Trash2, Download, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { GenerationResult } from "../types";
import { downloadImage } from "../utils/imageUtils";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GenerationResult[];
  onSelectResult: (item: GenerationResult) => void;
  onClearHistory: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md border-l border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Session Gallery</span>
              </h2>
              <p className="text-xs text-neutral-400">
                {history.length} transformation{history.length === 1 ? "" : "s"} created
              </p>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 p-8 space-y-2">
                <Clock className="h-8 w-8 text-neutral-600" />
                <p className="text-sm font-medium text-neutral-400">
                  No transformations yet
                </p>
                <p className="text-xs text-neutral-500">
                  Transformed images will appear here during this session.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl border border-neutral-800 bg-neutral-950 p-3 hover:border-neutral-700 transition-all flex gap-3"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-neutral-900 border border-neutral-800"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.model}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 truncate">
                          {item.model}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {(item.generationTimeMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 line-clamp-2 mt-1 font-medium">
                        {item.prompt}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 text-xs">
                      <button
                        onClick={() => {
                          onSelectResult(item);
                          onClose();
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View &rarr;
                      </button>
                      <button
                        onClick={() =>
                          downloadImage(
                            item.imageUrl,
                            `history-${item.modelId}-${item.id}.png`
                          )
                        }
                        className="text-neutral-400 hover:text-neutral-200"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
