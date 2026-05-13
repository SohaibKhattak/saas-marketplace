"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: (File | string)[];
  onChange: (files: (File | string)[]) => void;
  maxFiles?: number;
  label?: string;
  description?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxFiles = 1,
  label,
  description,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create object URLs for previews and clean them up
  const [objectUrls, setObjectUrls] = useState<Map<File, string>>(new Map());

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxFiles - value.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newObjectUrls = new Map(objectUrls);
    filesToAdd.forEach(file => {
      newObjectUrls.set(file, URL.createObjectURL(file));
    });
    setObjectUrls(newObjectUrls);

    const newValue = [...value, ...filesToAdd];
    onChange(newValue);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const itemToRemove = value[index];
    if (itemToRemove instanceof File) {
      const url = objectUrls.get(itemToRemove);
      if (url) URL.revokeObjectURL(url);
      const newObjectUrls = new Map(objectUrls);
      newObjectUrls.delete(itemToRemove);
      setObjectUrls(newObjectUrls);
    }
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  return (
    <div className="space-y-4 w-full">
      {label && <label className="text-sm font-black uppercase tracking-widest text-slate-400">{label}</label>}
      
      {value.length < maxFiles && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-200 rounded-[2rem] transition-all cursor-pointer bg-slate-50/50 hover:bg-white hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 mb-4">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <p className="mb-1 text-sm text-slate-900 font-black tracking-tight">
              Click to upload {label?.toLowerCase()}
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {description || `PNG or JPG (Up to ${maxFiles})`}
            </p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            multiple={maxFiles > 1}
            accept="image/png, image/jpeg"
            onChange={onFileChange}
          />
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {value.map((item, index) => {
            const preview = typeof item === "string" ? item : objectUrls.get(item);
            
            return (
              <div key={index} className="group relative aspect-video rounded-[1.5rem] overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500">
                {preview ? (
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-50">
                    <ImageIcon className="w-8 h-8 text-slate-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-10 w-10 rounded-2xl shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
