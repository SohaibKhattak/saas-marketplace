"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { FileNode } from "./templates";

// File icon colors based on extension
function getFileIconColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = {
    tsx: "text-blue-400",
    ts: "text-neutral-900",
    jsx: "text-yellow-400",
    js: "text-yellow-500",
    css: "text-pink-400",
    html: "text-orange-400",
    json: "text-yellow-300",
    md: "text-gray-400",
    prisma: "text-teal-400",
    env: "text-green-400",
    example: "text-green-400",
    py: "text-yellow-400",
    txt: "text-gray-400",
  };
  return colors[ext || ""] || "text-gray-500";
}

// ─── Inline Name Input ───────────────────────────────────────────────
interface InlineInputProps {
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

function InlineInput({ initialValue, onConfirm, onCancel, placeholder }: InlineInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialValue) {
      onConfirm(trimmed);
    } else if (!trimmed) {
      onCancel();
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1 px-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={handleSubmit}
        placeholder={placeholder}
        className="flex-1 bg-accent text-foreground text-sm px-1.5 py-0.5 rounded border border-primary/50 outline-none focus:ring-1 focus:ring-black min-w-0"
        spellCheck={false}
      />
    </div>
  );
}

// ─── File Tree Item ──────────────────────────────────────────────────
interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  path: string;
  activePath: string | null;
  onFileClick: (path: string, node: FileNode) => void;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onDeleteNode: (path: string) => void;
  onRenameNode: (path: string, newName: string) => void;
}

function FileTreeItem({
  node,
  depth,
  path,
  activePath,
  onFileClick,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isActive = path === activePath;
  const isFolder = node.type === "folder";

  // If renaming, show inline input
  if (isRenaming) {
    return (
      <div style={{ paddingLeft: `${depth * 12 + 8}px` }} className="py-0.5">
        <div className="flex items-center gap-1">
          {isFolder ? (
            <Folder className="h-4 w-4 text-amber-400 shrink-0 ml-[18px]" />
          ) : (
            <File className={`h-4 w-4 shrink-0 ml-[18px] ${getFileIconColor(node.name)}`} />
          )}
          <InlineInput
            initialValue={node.name}
            onConfirm={(newName) => {
              onRenameNode(path, newName);
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`flex items-center w-full px-2 py-1 text-sm cursor-pointer transition-colors group ${
          isActive ? "bg-accent text-accent-foreground" : "text-gray-500 hover:bg-accent/50"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setIsOpen(!isOpen);
          } else {
            onFileClick(path, node);
          }
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Icon */}
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 mr-1 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 mr-1 shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 mr-1.5 text-amber-400 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 mr-1.5 text-amber-400 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 mr-1 shrink-0" />
            <File className={`h-4 w-4 mr-1.5 shrink-0 ${getFileIconColor(node.name)}`} />
          </>
        )}

        {/* Name */}
        <span className="truncate flex-1">{node.name}</span>

        {/* Hover Actions */}
        {showActions && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            {/* Folder-specific: add file/folder inside */}
            {isFolder && (
              <>
                <button
                  className="p-0.5 rounded hover:bg-background/50 text-gray-500 hover:text-foreground"
                  title="New file inside"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                    onCreateFile(path);
                  }}
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-background/50 text-gray-500 hover:text-foreground"
                  title="New folder inside"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                    onCreateFolder(path);
                  }}
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              </>
            )}
            {/* Rename */}
            <button
              className="p-0.5 rounded hover:bg-background/50 text-gray-500 hover:text-foreground"
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </button>
            {/* Delete */}
            <button
              className="p-0.5 rounded hover:bg-background/50 text-gray-500 hover:text-destructive"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(path);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              path={`${path}/${child.name}`}
              activePath={activePath}
              onFileClick={onFileClick}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteNode={onDeleteNode}
              onRenameNode={onRenameNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New Item Input (appears in-tree when creating) ──────────────────
interface NewItemInputProps {
  depth: number;
  type: "file" | "folder";
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

function NewItemInput({ depth, type, onConfirm, onCancel }: NewItemInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="flex items-center gap-1 py-0.5 px-2"
      style={{ paddingLeft: `${depth * 12 + 8 + 18}px` }}
    >
      {type === "folder" ? (
        <Folder className="h-4 w-4 text-amber-400 shrink-0" />
      ) : (
        <File className="h-4 w-4 text-gray-500 shrink-0" />
      )}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onConfirm(value.trim());
          }
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => {
          if (value.trim()) {
            onConfirm(value.trim());
          } else {
            onCancel();
          }
        }}
        placeholder={type === "folder" ? "folder name" : "filename.ext"}
        className="flex-1 bg-accent text-foreground text-sm px-1.5 py-0.5 rounded border border-primary/50 outline-none focus:ring-1 focus:ring-black min-w-0"
        spellCheck={false}
      />
    </div>
  );
}

// ─── File Explorer ───────────────────────────────────────────────────
interface FileExplorerProps {
  files: FileNode[];
  activePath: string | null;
  onFileClick: (path: string, node: FileNode) => void;
  onCreateFile: (parentPath: string, name: string) => void;
  onCreateFolder: (parentPath: string, name: string) => void;
  onDeleteNode: (path: string) => void;
  onRenameNode: (path: string, newName: string) => void;
  projectName?: string;
}

export function FileExplorer({
  files,
  activePath,
  onFileClick,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
  projectName = "PROJECT",
}: FileExplorerProps) {
  // Track which folder is pending a new item creation and what type
  const [pendingCreate, setPendingCreate] = useState<{
    parentPath: string;
    type: "file" | "folder";
  } | null>(null);

  // Calculate depth for root-level new items
  const getDepthForPath = (path: string) => {
    if (path === "/") return 0;
    return path.split("/").length;
  };

  // Render new-item input at the right place in the tree
  const renderNewItemInput = (parentPath: string, depth: number) => {
    if (!pendingCreate || pendingCreate.parentPath !== parentPath) return null;
    return (
      <NewItemInput
        depth={depth}
        type={pendingCreate.type}
        onConfirm={(name) => {
          if (pendingCreate.type === "file") {
            onCreateFile(parentPath, name);
          } else {
            onCreateFolder(parentPath, name);
          }
          setPendingCreate(null);
        }}
        onCancel={() => setPendingCreate(null)}
      />
    );
  };

  // Recursively render tree, injecting NewItemInput where needed
  const renderTree = (nodes: FileNode[], parentPath: string, depth: number) => {
    return (
      <>
        {nodes.map((node) => {
          const nodePath = parentPath === "/" ? node.name : `${parentPath}/${node.name}`;
          return (
            <div key={node.name}>
              <FileTreeItem
                node={node}
                depth={depth}
                path={nodePath}
                activePath={activePath}
                onFileClick={onFileClick}
                onCreateFile={(p) => setPendingCreate({ parentPath: p, type: "file" })}
                onCreateFolder={(p) => setPendingCreate({ parentPath: p, type: "folder" })}
                onDeleteNode={onDeleteNode}
                onRenameNode={onRenameNode}
              />
              {/* If this is a folder and it's the pending parent, show input inside it */}
              {node.type === "folder" && renderNewItemInput(nodePath, depth + 1)}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {projectName}
        </span>
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-accent rounded transition-colors"
            title="New File"
            onClick={() => setPendingCreate({ parentPath: "/", type: "file" })}
          >
            <FilePlus className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <button
            className="p-1 hover:bg-accent rounded transition-colors"
            title="New Folder"
            onClick={() => setPendingCreate({ parentPath: "/", type: "folder" })}
          >
            <FolderPlus className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {renderTree(files, "/", 0)}
        {/* Root-level new item input */}
        {renderNewItemInput("/", 0)}
      </div>
    </div>
  );
}
