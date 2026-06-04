"use client";

import {
  Play,
  Square,
  Save,
  Download,
  Upload,
  Rocket,
  Settings,
  Loader2,
  GitBranch,
  Undo2,
  Redo2,
  Search,
  Command,
} from "lucide-react";

interface ToolbarProps {
  projectName: string;
  isRunning: boolean;
  isSaving: boolean;
  isDeploying: boolean;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onDeploy: () => void;
  onExport: () => void;
  templateName?: string;
}

export function Toolbar({
  projectName,
  isRunning,
  isSaving,
  isDeploying,
  onRun,
  onStop,
  onSave,
  onDeploy,
  onExport,
  templateName,
}: ToolbarProps) {
  return (
    <div className="flex items-center h-12 px-3 border-b border-border bg-muted/30 gap-1">
      {/* Left: Project info */}
      <div className="flex items-center gap-2 mr-4">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Command className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold truncate max-w-[150px]">
            {projectName}
          </span>
        </div>
        {templateName && (
          <span className="text-xs text-gray-500 bg-muted px-2 py-0.5 rounded-sm hidden sm:inline-block">
            {templateName}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Center: Actions */}
      <div className="flex items-center gap-1 mx-2">
        {/* Run / Stop */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-semibold tracking-tight bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <Square className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-semibold tracking-tight bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">Run</span>
          </button>
        )}

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm text-gray-500 hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm text-gray-500 hover:bg-accent hover:text-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Git-like indicator */}
      <div className="flex items-center gap-1.5 mx-2 px-2 py-1 rounded-sm text-xs text-gray-500 bg-muted/50">
        <GitBranch className="h-3 w-3" />
        <span className="hidden sm:inline">main</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Deploy + Theme */}
      <div className="flex items-center gap-1">
        <button
          onClick={onDeploy}
          disabled={isDeploying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-semibold tracking-tight bg-black text-primary-foreground hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
        >
          {isDeploying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Rocket className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            {isDeploying ? "Deploying..." : "Deploy to Marketplace"}
          </span>
        </button>

        <div className="w-px h-6 bg-border mx-1" />
        
      </div>
    </div>
  );
}
