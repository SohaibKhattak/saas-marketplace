"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  path?: string;
}

export function CodeEditor({ value, language, onChange, path }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<unknown>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (val) => {
      if (val !== undefined) {
        onChange(val);
      }
    },
    [onChange]
  );

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language === "prisma" ? "graphql" : language}
        value={value}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        onChange={handleChange}
        onMount={handleMount}
        path={path}
        loading={
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading editor...</span>
          </div>
        }
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true, scale: 2, showSlider: "mouseover" },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showMethods: true,
            showFunctions: true,
            showVariables: true,
            showClasses: true,
          },
        }}
      />
    </div>
  );
}
