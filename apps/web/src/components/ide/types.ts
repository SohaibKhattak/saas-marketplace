export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface OpenTab {
  id: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  path: string;
}

export interface ConsoleMessage {
  id: string;
  type: "info" | "error" | "warn" | "success" | "system";
  message: string;
  timestamp: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  files: FileNode[];
}
