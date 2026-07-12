"use client";

import { useState } from "react";
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet} from "lucide-react";

type DeviceSize = "mobile" | "tablet" | "desktop";

const deviceSizes: Record<DeviceSize, { width: string; label: string; icon: React.ElementType }> = {
  mobile: { width: "375px", label: "Mobile", icon: Smartphone },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
};

interface PreviewPanelProps {
  htmlContent: string | null;
  isRunning: boolean;
  url?: string;
}

export function PreviewPanel({ htmlContent, isRunning, url }: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceSize>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const previewUrl = url || "about:blank";

  // Generate preview HTML from project files
  const generatePreviewHtml = () => {
    if (!htmlContent) return "";
    return htmlContent;
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-semibold tracking-tight text-gray-500 uppercase tracking-wider">
            Preview
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Device Toggles */}
          {(Object.entries(deviceSizes) as [DeviceSize, typeof deviceSizes[DeviceSize]][]).map(
            ([key, size]) => {
              const Icon = size.icon;
              return (
                <button
                  key={key}
                  className={`p-1 rounded transition-colors ${
                    device === key
                      ? "bg-accent text-accent-foreground"
                      : "text-gray-500 hover:bg-accent/50"
                  }`}
                  onClick={() => setDevice(key)}
                  title={size.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            }
          )}

          <div className="w-px h-4 bg-border mx-1" />

          {/* Refresh */}
          <button
            className="p-1 hover:bg-accent rounded transition-colors"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20">
        <div className="flex-1 flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-sm text-xs text-gray-500">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {isRunning ? "localhost:3000" : "preview://app"}
          </span>
        </div>
        <button className="p-1 hover:bg-accent rounded transition-colors" title="Open in new tab">
          <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center bg-muted/10 overflow-hidden">
        {isRunning ? (
          <div
            className="h-full bg-white transition-all duration-300 shadow-sm"
            style={{ width: deviceSizes[device].width, maxWidth: "100%" }}
          >
            <iframe
              key={refreshKey}
              srcDoc={generatePreviewHtml()}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        ) : (
          <div className="text-center text-gray-500/50 p-8">
            <div className="relative mx-auto mb-4 w-20 h-20">
              <Monitor className="h-20 w-20 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="h-8 w-8 opacity-30" />
              </div>
            </div>
            <p className="text-sm font-semibold tracking-tight mb-1">No preview available</p>
            <p className="text-xs">Click <strong>Run</strong> to build and preview your app</p>
          </div>
        )}
      </div>
    </div>
  );
}
