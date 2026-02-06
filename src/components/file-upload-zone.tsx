"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp } from "lucide-react";

export interface FileUploadProgress {
  fileName: string;
  percent: number;
  current: number;
  total: number;
}

interface FileUploadZoneProps {
  onUpload: (files: FileList) => Promise<void>;
  uploading?: boolean;
  progress?: FileUploadProgress | null;
}

export function FileUploadZone({ onUpload, uploading = false, progress }: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  }

  if (uploading && progress) {
    return (
      <div className="border-2 border-dashed rounded-lg p-6 text-center border-primary/50 bg-primary/5">
        <FileUp className="mx-auto h-8 w-8 text-primary mb-3 animate-pulse" />
        <p className="text-sm font-medium truncate px-4">{progress.fileName}</p>
        <div className="mt-3 px-4">
          <Progress value={progress.percent} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {progress.percent}%
          {progress.total > 1 && ` — Fichier ${progress.current} / ${progress.total}`}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleChange}
        disabled={uploading}
      />
      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm font-medium">
        {uploading ? "Upload en cours..." : "Glisser-déposer ou cliquer pour uploader"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Images, PDF, documents... (max 50 Mo)
      </p>
    </div>
  );
}
