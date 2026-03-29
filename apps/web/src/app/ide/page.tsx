"use client";

import { useState, useCallback } from "react";
import { FileExplorer } from "@/components/ide/file-explorer";
import { EditorTabs } from "@/components/ide/editor-tabs";
import { CodeEditor } from "@/components/ide/code-editor";
import { TerminalPanel, ConsoleMessage } from "@/components/ide/terminal-panel";
import { PreviewPanel } from "@/components/ide/preview-panel";
import { Toolbar } from "@/components/ide/toolbar";
import { TemplateSelector } from "@/components/ide/template-selector";
import { ExtensionsPanel } from "@/components/ide/extensions-panel";
import { DeployDialog } from "@/components/ide/deploy-dialog";
import { FileNode, Template, getLanguageFromPath, flattenFiles } from "@/components/ide/templates";
import {
  Code2,
  Files,
  Blocks,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelBottomClose,
  PanelBottomOpen,
} from "lucide-react";

interface FileTab {
  id: string;
  path: string;
  name: string;
  language: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
}

// ─── File tree helpers (immutable operations) ─────────────────────────

/** Split a path like "src/pages/Landing.tsx" into segments */
function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** Find a node inside a file tree by path segments */
function findNodeBySegments(nodes: FileNode[], segments: string[]): FileNode | null {
  if (segments.length === 0) return null;
  const [head, ...rest] = segments;
  const node = nodes.find((n) => n.name === head);
  if (!node) return null;
  if (rest.length === 0) return node;
  if (node.type === "folder" && node.children) {
    return findNodeBySegments(node.children, rest);
  }
  return null;
}

/** Insert a new node inside the tree at a given parent path */
function insertNode(tree: FileNode[], parentPath: string, newNode: FileNode): FileNode[] {
  // Root level
  if (parentPath === "/") {
    // Avoid duplicates
    if (tree.some((n) => n.name === newNode.name)) return tree;
    return [...tree, newNode];
  }

  const segments = splitPath(parentPath);

  function recurse(nodes: FileNode[], segs: string[]): FileNode[] {
    if (segs.length === 0) {
      if (nodes.some((n) => n.name === newNode.name)) return nodes;
      return [...nodes, newNode];
    }
    const [head, ...rest] = segs;
    return nodes.map((n) => {
      if (n.name === head && n.type === "folder") {
        return {
          ...n,
          isOpen: true,
          children: recurse(n.children || [], rest),
        };
      }
      return n;
    });
  }

  return recurse(tree, segments);
}

/** Delete a node from the tree by full path */
function deleteNode(tree: FileNode[], path: string): FileNode[] {
  const segments = splitPath(path);
  if (segments.length === 0) return tree;

  if (segments.length === 1) {
    return tree.filter((n) => n.name !== segments[0]);
  }

  const parentSegs = segments.slice(0, -1);
  const targetName = segments[segments.length - 1];

  function recurse(nodes: FileNode[], segs: string[]): FileNode[] {
    if (segs.length === 0) {
      return nodes.filter((n) => n.name !== targetName);
    }
    const [head, ...rest] = segs;
    return nodes.map((n) => {
      if (n.name === head && n.type === "folder") {
        return { ...n, children: recurse(n.children || [], rest) };
      }
      return n;
    });
  }

  return recurse(tree, parentSegs);
}

/** Rename a node in the tree */
function renameNode(tree: FileNode[], path: string, newName: string): FileNode[] {
  const segments = splitPath(path);
  if (segments.length === 0) return tree;

  if (segments.length === 1) {
    return tree.map((n) => (n.name === segments[0] ? { ...n, name: newName } : n));
  }

  const parentSegs = segments.slice(0, -1);
  const oldName = segments[segments.length - 1];

  function recurse(nodes: FileNode[], segs: string[]): FileNode[] {
    if (segs.length === 0) {
      // Check for duplicate name
      if (nodes.some((n) => n.name === newName)) return nodes;
      return nodes.map((n) => (n.name === oldName ? { ...n, name: newName } : n));
    }
    const [head, ...rest] = segs;
    return nodes.map((n) => {
      if (n.name === head && n.type === "folder") {
        return { ...n, children: recurse(n.children || [], rest) };
      }
      return n;
    });
  }

  return recurse(tree, parentSegs);
}

/** Collect all paths that start with a given prefix (for deleting open tabs) */
function collectPaths(nodes: FileNode[], parentPath: string): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.type === "file") result.push(nodePath);
    if (node.children) result.push(...collectPaths(node.children, nodePath));
  }
  return result;
}

// ─── Main IDE Component ───────────────────────────────────────────────

export default function IDEPage() {
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [projectName, setProjectName] = useState("my-project");

  // Editor state
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);

  // Panel visibility
  const [showExplorer, setShowExplorer] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);

  // Sidebar tab: "files" or "extensions"
  const [sidebarTab, setSidebarTab] = useState<"files" | "extensions">("files");

  // Terminal messages
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);

  // Run state
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Deploy dialog
  const [showDeployDialog, setShowDeployDialog] = useState(false);

  // Console message helper
  const addConsoleMessage = useCallback(
    (type: ConsoleMessage["type"], message: string) => {
      setConsoleMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          message,
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  // ─── Template selection ──────────────────────────────────────────
  const handleTemplateSelect = useCallback(
    (template: Template) => {
      setSelectedTemplate(template);
      setProjectFiles(template.files);
      const nameMap: Record<string, string> = {
        "react-saas": "my-saas-app",
        "node-api": "my-saas-api",
        fullstack: "my-fullstack-saas",
        "django-saas": "my-django-saas",
      };
      setProjectName(nameMap[template.id] || "my-project");
      setTabs([]);
      setActiveTabId(null);
      setActivePath(null);
      setConsoleMessages([]);
      setIsRunning(false);
      setPreviewHtml(null);

      // Auto-open main file
      const allFiles = flattenFiles(template.files);
      const mainFile =
        allFiles.find((f) => f.path.endsWith("App.tsx")) ||
        allFiles.find((f) => f.path.endsWith("index.ts")) ||
        allFiles.find((f) => f.path.endsWith("page.tsx")) ||
        allFiles.find((f) => f.path.endsWith("settings.py")) ||
        allFiles[0];

      if (mainFile) {
        const tabId = mainFile.path;
        setTabs([
          {
            id: tabId,
            path: mainFile.path,
            name: mainFile.path.split("/").pop() || mainFile.path,
            language: mainFile.language,
            content: mainFile.content,
            originalContent: mainFile.content,
            isDirty: false,
          },
        ]);
        setActiveTabId(tabId);
        setActivePath(mainFile.path);
      }

      addConsoleMessage("system", `Project initialized from "${template.name}" template`);
      addConsoleMessage("info", `${allFiles.length} files loaded`);
      addConsoleMessage("info", 'Ready! Click "Run" to build and preview your app.');
    },
    [addConsoleMessage]
  );

  // ─── File click (open in editor) ────────────────────────────────
  const handleFileClick = useCallback(
    (path: string, node: FileNode) => {
      if (node.type !== "file") return;
      const content = node.content ?? "";

      setActivePath(path);

      const existingTab = tabs.find((t) => t.path === path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      const newTab: FileTab = {
        id: path,
        path,
        name: node.name,
        language: node.language || getLanguageFromPath(path),
        content,
        originalContent: content,
        isDirty: false,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(path);
    },
    [tabs]
  );

  // ─── Editor change ──────────────────────────────────────────────
  const handleEditorChange = useCallback(
    (value: string) => {
      if (!activeTabId) return;
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, content: value, isDirty: value !== tab.originalContent }
            : tab
        )
      );
    },
    [activeTabId]
  );

  // ─── Tab close ──────────────────────────────────────────────────
  const handleTabClose = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const nextTab = newTabs[closedIndex] || newTabs[closedIndex - 1] || null;
          setActiveTabId(nextTab?.id || null);
          setActivePath(nextTab?.path || null);
        }
        return newTabs;
      });
    },
    [activeTabId]
  );

  // ─── Create file ───────────────────────────────────────────────
  const handleCreateFile = useCallback(
    (parentPath: string, name: string) => {
      const newFile: FileNode = {
        name,
        type: "file",
        content: "",
        language: getLanguageFromPath(name),
      };

      setProjectFiles((prev) => insertNode(prev, parentPath, newFile));

      // Automatically open the new file in the editor
      const fullPath = parentPath === "/" ? name : `${parentPath}/${name}`;
      const newTab: FileTab = {
        id: fullPath,
        path: fullPath,
        name,
        language: getLanguageFromPath(name),
        content: "",
        originalContent: "",
        isDirty: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(fullPath);
      setActivePath(fullPath);

      addConsoleMessage("info", `Created file: ${fullPath}`);
    },
    [addConsoleMessage]
  );

  // ─── Create folder ─────────────────────────────────────────────
  const handleCreateFolder = useCallback(
    (parentPath: string, name: string) => {
      const newFolder: FileNode = {
        name,
        type: "folder",
        children: [],
        isOpen: true,
      };

      setProjectFiles((prev) => insertNode(prev, parentPath, newFolder));
      const fullPath = parentPath === "/" ? name : `${parentPath}/${name}`;
      addConsoleMessage("info", `Created folder: ${fullPath}`);
    },
    [addConsoleMessage]
  );

  // ─── Delete node ───────────────────────────────────────────────
  const handleDeleteNode = useCallback(
    (path: string) => {
      // Find the node to see if it's a folder (need to close tabs for children)
      const segments = splitPath(path);
      const node = findNodeBySegments(projectFiles, segments);

      let pathsToClose: string[] = [path];
      if (node?.type === "folder" && node.children) {
        pathsToClose = [...pathsToClose, ...collectPaths(node.children, path)];
      }

      // Remove from file tree
      setProjectFiles((prev) => deleteNode(prev, path));

      // Close any open tabs for deleted files
      setTabs((prev) => {
        const newTabs = prev.filter((t) => !pathsToClose.includes(t.path));
        if (activeTabId && pathsToClose.includes(activeTabId)) {
          const nextTab = newTabs[0] || null;
          setActiveTabId(nextTab?.id || null);
          setActivePath(nextTab?.path || null);
        }
        return newTabs;
      });

      addConsoleMessage("info", `Deleted: ${path}`);
    },
    [projectFiles, activeTabId, addConsoleMessage]
  );

  // ─── Rename node ───────────────────────────────────────────────
  const handleRenameNode = useCallback(
    (path: string, newName: string) => {
      const segments = splitPath(path);
      const oldName = segments[segments.length - 1];
      if (oldName === newName) return;

      // Build new path
      const parentSegments = segments.slice(0, -1);
      const newPath = parentSegments.length > 0
        ? `${parentSegments.join("/")}/${newName}`
        : newName;

      // Find node to check if folder
      const node = findNodeBySegments(projectFiles, segments);

      // Rename in tree
      setProjectFiles((prev) => renameNode(prev, path, newName));

      // Update open tabs
      setTabs((prev) =>
        prev.map((tab) => {
          // Exact match (file renamed)
          if (tab.path === path) {
            return {
              ...tab,
              id: newPath,
              path: newPath,
              name: newName,
              language: getLanguageFromPath(newName),
            };
          }
          // Children of renamed folder
          if (node?.type === "folder" && tab.path.startsWith(path + "/")) {
            const relativePart = tab.path.slice(path.length);
            const updatedPath = newPath + relativePart;
            return { ...tab, id: updatedPath, path: updatedPath };
          }
          return tab;
        })
      );

      // Update active tab/path
      if (activeTabId === path) {
        setActiveTabId(newPath);
        setActivePath(newPath);
      } else if (node?.type === "folder" && activeTabId?.startsWith(path + "/")) {
        const updatedActive = newPath + activeTabId.slice(path.length);
        setActiveTabId(updatedActive);
        setActivePath(updatedActive);
      }

      addConsoleMessage("info", `Renamed: ${oldName} → ${newName}`);
    },
    [projectFiles, activeTabId, addConsoleMessage]
  );

  // ─── Run handler ───────────────────────────────────────────────
  const handleRun = useCallback(() => {
    setIsRunning(true);
    setShowTerminal(true);
    setShowPreview(true);

    const isDjango = selectedTemplate?.id === "django-saas";
    addConsoleMessage("system", isDjango ? "$ python manage.py runserver" : "$ npm run dev");
    addConsoleMessage("info", "Starting development server...");

    setTimeout(() => addConsoleMessage("info", "Compiling..."), 500);

    setTimeout(() => {
      addConsoleMessage("success", "Compiled successfully!");
      const port = isDjango ? "8000" : "3000";
      addConsoleMessage("info", `Local:   http://localhost:${port}`);
      addConsoleMessage("info", `Network: http://192.168.1.5:${port}`);
      addConsoleMessage("success", isDjango ? "Ready in 0.8s" : "Ready in 1.2s");

      // Generate preview HTML
      const preview = generatePreviewHtml();
      setPreviewHtml(preview);
    }, 1500);
  }, [projectFiles, projectName, selectedTemplate, addConsoleMessage]);

  // Generate preview based on template
  const generatePreviewHtml = useCallback(() => {
    const allFiles = flattenFiles(projectFiles);
    const cssFile = allFiles.find((f) => f.path.includes("globals.css"));

    const templatePreviews: Record<string, string> = {
      "react-saas": `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header class="container mx-auto px-6 py-16">
            <nav class="flex items-center justify-between mb-16">
              <h1 class="text-2xl font-bold text-indigo-600">YourSaaS</h1>
              <div class="flex gap-4">
                <a href="#" class="text-gray-600 hover:text-gray-900">Pricing</a>
                <a href="#" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Get Started</a>
              </div>
            </nav>
            <div class="text-center max-w-3xl mx-auto">
              <h2 class="text-5xl font-bold text-gray-900 mb-6">Build Something Amazing</h2>
              <p class="text-xl text-gray-600 mb-8">The all-in-one platform to launch, grow, and scale your SaaS business.</p>
              <button class="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-indigo-700 transition shadow-lg">Start Free Trial</button>
            </div>
          </header>
          <section class="container mx-auto px-6 py-16">
            <div class="grid grid-cols-3 gap-8">
              <div class="bg-white p-6 rounded-xl shadow-sm"><h3 class="text-lg font-semibold mb-2">Analytics</h3><p class="text-gray-600">Real-time insights</p></div>
              <div class="bg-white p-6 rounded-xl shadow-sm"><h3 class="text-lg font-semibold mb-2">Automation</h3><p class="text-gray-600">Automate workflows</p></div>
              <div class="bg-white p-6 rounded-xl shadow-sm"><h3 class="text-lg font-semibold mb-2">Integrations</h3><p class="text-gray-600">100+ tools</p></div>
            </div>
          </section>
        </div>`,
      "node-api": `
        <div class="min-h-screen bg-gray-950 text-green-400 font-mono p-8">
          <div class="max-w-2xl mx-auto">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-gray-500 text-sm ml-2">Terminal</span>
            </div>
            <pre class="text-sm leading-relaxed">
<span class="text-gray-500">$</span> curl http://localhost:3001/api/health
<span class="text-green-300">{ "status": "ok" }</span>

<span class="text-gray-500">$</span> curl http://localhost:3001/api/products
<span class="text-green-300">{ "products": [], "total": 0 }</span>

<span class="text-green-400">Server running on port 3001</span>
<span class="text-green-400 animate-pulse">█</span></pre>
          </div>
        </div>`,
      fullstack: `
        <div class="min-h-screen">
          <nav class="border-b bg-white sticky top-0 z-50">
            <div class="container mx-auto px-6 h-16 flex items-center justify-between">
              <span class="text-xl font-bold text-indigo-600">YourSaaS</span>
              <div class="flex items-center gap-6">
                <a href="#" class="text-gray-600">Pricing</a>
                <a href="#" class="bg-indigo-600 text-white px-4 py-2 rounded-lg">Get Started</a>
              </div>
            </div>
          </nav>
          <section class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-24">
            <div class="container mx-auto px-6 text-center">
              <h1 class="text-5xl font-bold mb-6">Your SaaS Platform</h1>
              <p class="text-xl opacity-90 mb-8 max-w-2xl mx-auto">Everything you need to build and grow.</p>
              <div class="flex gap-4 justify-center">
                <a href="#" class="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold">Start Free</a>
                <a href="#" class="border border-white px-6 py-3 rounded-lg">Live Demo</a>
              </div>
            </div>
          </section>
        </div>`,
      "django-saas": `
        <div class="min-h-screen bg-gray-950 text-green-400 font-mono p-8">
          <div class="max-w-2xl mx-auto">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-gray-500 text-sm ml-2">Django Server</span>
            </div>
            <pre class="text-sm leading-relaxed">
<span class="text-yellow-400">Watching for file changes with StatReloader</span>
<span class="text-green-300">Performing system checks...</span>

<span class="text-green-400">System check identified no issues (0 silenced).</span>

<span class="text-gray-500">$</span> curl http://localhost:8000/api/health/
<span class="text-green-300">{
  "status": "ok",
  "service": "saas-api"
}</span>

<span class="text-gray-500">$</span> curl http://localhost:8000/api/products/
<span class="text-green-300">{
  "count": 0,
  "results": []
}</span>

<span class="text-green-400">Django version 5.1, using settings 'config.settings'</span>
<span class="text-green-400">Starting development server at http://127.0.0.1:8000/</span>
<span class="text-green-400 animate-pulse">█</span></pre>
          </div>
        </div>`,
    };

    const templateHtml = templatePreviews[selectedTemplate?.id || ""] || "<p>Preview not available</p>";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${projectName}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; }
    ${cssFile?.content?.replace(/@tailwind[^;]+;/g, "").replace(/@layer\s+base\s*\{[^}]+\}/g, "") || ""}
  </style>
</head>
<body>
  <div id="root">${templateHtml}</div>
</body>
</html>`;
  }, [projectFiles, projectName, selectedTemplate]);

  // ─── Stop handler ──────────────────────────────────────────────
  const handleStop = useCallback(() => {
    setIsRunning(false);
    addConsoleMessage("system", "Development server stopped");
    setPreviewHtml(null);
  }, [addConsoleMessage]);

  // ─── Save handler ──────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setIsSaving(true);
    addConsoleMessage("info", "Saving project...");

    setTimeout(() => {
      // Sync tab content back into the file tree
      setTabs((prev) =>
        prev.map((tab) => ({
          ...tab,
          isDirty: false,
          originalContent: tab.content,
        }))
      );
      setIsSaving(false);
      addConsoleMessage("success", "Project saved successfully");
    }, 800);
  }, [addConsoleMessage]);

  // ─── Deploy handler (opens dialog) ─────────────────────────────
  const handleDeploy = useCallback(() => {
    setShowDeployDialog(true);
  }, []);

  // ─── Export handler ────────────────────────────────────────────
  const handleExport = useCallback(() => {
    addConsoleMessage("info", "Exporting project as ZIP...");
    setTimeout(() => {
      addConsoleMessage("success", `${projectName}.zip downloaded`);
    }, 1000);
  }, [projectName, addConsoleMessage]);

  // ─── Render ─────────────────────────────────────────────────────

  if (!selectedTemplate) {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <Toolbar
        projectName={projectName}
        templateName={selectedTemplate.name}
        isRunning={isRunning}
        isSaving={isSaving}
        isDeploying={isDeploying}
        onRun={handleRun}
        onStop={handleStop}
        onSave={handleSave}
        onDeploy={handleDeploy}
        onExport={handleExport}
      />

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Activity Bar + Panel */}
        {showExplorer && (
          <div className="flex shrink-0">
            {/* Activity Bar (icon strip) */}
            <div className="w-12 bg-muted/30 border-r border-border flex flex-col items-center py-2 gap-1">
              <button
                onClick={() => setSidebarTab("files")}
                className={`p-2 rounded-lg transition-colors ${
                  sidebarTab === "files"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                title="Explorer"
              >
                <Files className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSidebarTab("extensions")}
                className={`p-2 rounded-lg transition-colors ${
                  sidebarTab === "extensions"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                title="Extensions"
              >
                <Blocks className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="w-60">
              {sidebarTab === "files" ? (
                <FileExplorer
                  files={projectFiles}
                  activePath={activePath}
                  onFileClick={handleFileClick}
                  onCreateFile={handleCreateFile}
                  onCreateFolder={handleCreateFolder}
                  onDeleteNode={handleDeleteNode}
                  onRenameNode={handleRenameNode}
                  projectName={projectName.toUpperCase()}
                />
              ) : (
                <ExtensionsPanel
                  onConsoleMessage={(type, message) => addConsoleMessage(type, message)}
                />
              )}
            </div>
          </div>
        )}

        {/* Editor + Terminal (vertical split) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <EditorTabs
                tabs={tabs}
                activeTab={activeTabId}
                onTabClick={(id) => {
                  setActiveTabId(id);
                  const tab = tabs.find((t) => t.id === id);
                  if (tab) setActivePath(tab.path);
                }}
                onTabClose={handleTabClose}
              />

              {/* Editor Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab ? (
                  <CodeEditor
                    value={activeTab.content}
                    language={activeTab.language}
                    onChange={handleEditorChange}
                    path={activeTab.path}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground/30">
                    <div className="text-center">
                      <Code2 className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">No file open</p>
                      <p className="text-sm mt-1">
                        Select a file from the explorer to start editing
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-[45%] shrink-0">
                <PreviewPanel htmlContent={previewHtml} isRunning={isRunning} />
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 shrink-0 border-t border-border">
              <TerminalPanel
                messages={consoleMessages}
                onClear={() => setConsoleMessages([])}
              />
            </div>
          )}
        </div>
      </div>

      {/* Deploy Dialog */}
      <DeployDialog
        open={showDeployDialog}
        onOpenChange={setShowDeployDialog}
        projectName={projectName}
        templateName={selectedTemplate.name}
        onDeployStart={() => {
          setIsDeploying(true);
          setShowTerminal(true);
        }}
        onDeploySuccess={() => {
          setIsDeploying(false);
        }}
        onDeployError={() => {
          setIsDeploying(false);
        }}
        onConsoleMessage={addConsoleMessage}
      />

      {/* Status Bar */}
      <div className="flex items-center justify-between h-6 px-3 bg-primary text-primary-foreground text-xs border-t border-primary/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className="hover:opacity-80 transition-opacity"
            title={showExplorer ? "Hide Explorer" : "Show Explorer"}
          >
            {showExplorer ? (
              <PanelLeftClose className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="hover:opacity-80 transition-opacity"
            title={showTerminal ? "Hide Terminal" : "Show Terminal"}
          >
            {showTerminal ? (
              <PanelBottomClose className="h-3.5 w-3.5" />
            ) : (
              <PanelBottomOpen className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="hover:opacity-80 transition-opacity"
            title={showPreview ? "Hide Preview" : "Show Preview"}
          >
            {showPreview ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
          </button>
          <span className="opacity-70">|</span>
          <span>
            {isRunning ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Running
              </span>
            ) : (
              "Ready"
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeTab && (
            <>
              <span>{activeTab.language}</span>
              <span>UTF-8</span>
              <span>Spaces: 2</span>
            </>
          )}
          <span>
            {tabs.filter((t) => t.isDirty).length > 0
              ? `${tabs.filter((t) => t.isDirty).length} unsaved`
              : "All saved"}
          </span>
        </div>
      </div>
    </div>
  );
}
