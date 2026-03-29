"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Star,
  Download,
  Check,
  X,
  Blocks,
  ChevronDown,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  extensions,
  defaultInstalledIds,
  categoryLabels,
  Extension,
  ExtensionCategory,
} from "./extensions-data";

interface ExtensionState {
  installed: boolean;
  enabled: boolean;
  loading: boolean; // for install/uninstall animation
}

// Render N filled stars + (5-N) empty
function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= full ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Single Extension Card ──────────────────────────────────────────
interface ExtensionCardProps {
  ext: Extension;
  state: ExtensionState;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onToggle: (id: string) => void;
}

function ExtensionCard({ ext, state, onInstall, onUninstall, onToggle }: ExtensionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group border rounded-lg p-3 transition-all hover:shadow-sm ${
        state.installed
          ? "border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04]"
          : "border-border hover:border-border/80"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`h-10 w-10 rounded-lg ${ext.color} flex items-center justify-center text-lg shrink-0 shadow-sm`}
        >
          {ext.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold truncate">{ext.name}</h4>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              v{ext.version}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{ext.publisher}</p>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {state.loading ? (
            <div className="h-7 w-16 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : state.installed ? (
            <button
              onClick={() => onUninstall(ext.id)}
              className="h-7 px-2.5 text-xs rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Uninstall
            </button>
          ) : (
            <button
              onClick={() => onInstall(ext.id)}
              className="h-7 px-3 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Install
            </button>
          )}
        </div>
      </div>

      {/* Description (expandable) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 w-full text-left"
      >
        <p
          className={`text-xs text-muted-foreground ${
            expanded ? "" : "line-clamp-1"
          }`}
        >
          {ext.description}
        </p>
      </button>

      {/* Bottom row: stats + enable/disable */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-3">
          <StarRating rating={ext.rating} />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Download className="h-3 w-3" />
            {ext.downloads}
          </div>
        </div>

        {/* Enable/Disable toggle (only if installed) */}
        {state.installed && (
          <button
            onClick={() => onToggle(ext.id)}
            className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
              state.enabled ? "text-green-500" : "text-muted-foreground"
            }`}
            title={state.enabled ? "Disable extension" : "Enable extension"}
          >
            {state.enabled ? (
              <>
                <ToggleRight className="h-4 w-4" />
                Enabled
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                Disabled
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Extensions Panel ───────────────────────────────────────────────
interface ExtensionsPanelProps {
  onConsoleMessage?: (type: "info" | "success", message: string) => void;
}

export function ExtensionsPanel({ onConsoleMessage }: ExtensionsPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | "all">("all");
  const [extensionStates, setExtensionStates] = useState<Record<string, ExtensionState>>(() => {
    const initial: Record<string, ExtensionState> = {};
    for (const ext of extensions) {
      initial[ext.id] = {
        installed: defaultInstalledIds.includes(ext.id),
        enabled: defaultInstalledIds.includes(ext.id),
        loading: false,
      };
    }
    return initial;
  });

  // Collapsible sections
  const [showInstalled, setShowInstalled] = useState(true);
  const [showRecommended, setShowRecommended] = useState(true);

  // Filter
  const filtered = useMemo(() => {
    return extensions.filter((ext) => {
      const matchSearch =
        !search ||
        ext.name.toLowerCase().includes(search.toLowerCase()) ||
        ext.publisher.toLowerCase().includes(search.toLowerCase()) ||
        ext.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || ext.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory]);

  const installedExts = filtered.filter((ext) => extensionStates[ext.id]?.installed);
  const recommendedExts = filtered.filter((ext) => !extensionStates[ext.id]?.installed);

  // Handlers
  const handleInstall = (id: string) => {
    setExtensionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], loading: true },
    }));

    // Simulate install delay
    setTimeout(() => {
      setExtensionStates((prev) => ({
        ...prev,
        [id]: { installed: true, enabled: true, loading: false },
      }));
      const ext = extensions.find((e) => e.id === id);
      onConsoleMessage?.("success", `Extension "${ext?.name}" installed successfully`);
    }, 1200);
  };

  const handleUninstall = (id: string) => {
    setExtensionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], loading: true },
    }));

    setTimeout(() => {
      setExtensionStates((prev) => ({
        ...prev,
        [id]: { installed: false, enabled: false, loading: false },
      }));
      const ext = extensions.find((e) => e.id === id);
      onConsoleMessage?.("info", `Extension "${ext?.name}" uninstalled`);
    }, 800);
  };

  const handleToggle = (id: string) => {
    setExtensionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
    const ext = extensions.find((e) => e.id === id);
    const willBeEnabled = !extensionStates[id].enabled;
    onConsoleMessage?.(
      "info",
      `Extension "${ext?.name}" ${willBeEnabled ? "enabled" : "disabled"}`
    );
  };

  // Unique categories from data
  const categories = useMemo(() => {
    const cats = new Set(extensions.map((e) => e.category));
    return Array.from(cats) as ExtensionCategory[];
  }, []);

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Blocks className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Extensions
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">
            {installedExts.length} installed
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search extensions..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            spellCheck={false}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Installed Section */}
        {installedExts.length > 0 && (
          <div>
            <button
              onClick={() => setShowInstalled(!showInstalled)}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/50 transition-colors"
            >
              {showInstalled ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Installed
              <span className="ml-auto text-[10px] font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {installedExts.length}
              </span>
            </button>
            {showInstalled && (
              <div className="px-2 pb-2 space-y-2">
                {installedExts.map((ext) => (
                  <ExtensionCard
                    key={ext.id}
                    ext={ext}
                    state={extensionStates[ext.id]}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended Section */}
        {recommendedExts.length > 0 && (
          <div>
            <button
              onClick={() => setShowRecommended(!showRecommended)}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/50 transition-colors"
            >
              {showRecommended ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Recommended
              <span className="ml-auto text-[10px] font-normal bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {recommendedExts.length}
              </span>
            </button>
            {showRecommended && (
              <div className="px-2 pb-2 space-y-2">
                {recommendedExts.map((ext) => (
                  <ExtensionCard
                    key={ext.id}
                    ext={ext}
                    state={extensionStates[ext.id]}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <Search className="h-8 w-8 mb-2" />
            <p className="text-xs">No extensions found</p>
            <p className="text-[10px] mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
