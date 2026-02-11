"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText } from "lucide-react";
import { ImagePreview } from "@/components/image-preview";
import { getFileIcon, formatFileSize } from "@/lib/utils";
import type { FileRecord, Profile } from "@/types/database";

interface FileWithUploader extends FileRecord {
  uploader?: Profile;
}

interface FileListProps {
  files: FileWithUploader[];
  onDownload: (file: FileRecord) => void;
  onDelete?: (file: FileRecord) => void;
  showUploader?: boolean;
}

export function FileList({
  files,
  onDownload,
  onDelete,
  showUploader = false,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3" />
        <p>Aucun fichier pour ce livrable</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.mime_type);
        const isImage = file.mime_type?.startsWith("image/");

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            {isImage ? (
              <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                <ImagePreview file={file} />
              </div>
            ) : (
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size_bytes)} • v{file.version}
                {showUploader && file.uploader && ` • ${file.uploader.full_name || file.uploader.email}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={onDelete ? "ghost" : "outline"}
                size={onDelete ? "icon" : "sm"}
                onClick={() => onDownload(file)}
                className="shrink-0"
                aria-label={`Telecharger ${file.name}`}
              >
                <Download className="h-4 w-4 md:mr-2" />
                {!onDelete && <span className="hidden md:inline">Télécharger</span>}
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(file)}
                  aria-label={`Supprimer ${file.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface FileGalleryProps {
  files: FileRecord[];
  onFileClick: (file: FileRecord) => void;
}

export function FileGallery({ files, onFileClick }: FileGalleryProps) {
  const imageFiles = files.filter((f) => f.mime_type?.startsWith("image/"));

  if (imageFiles.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Aperçu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {imageFiles.map((file) => (
            <button
              type="button"
              key={file.id}
              className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
              onClick={() => onFileClick(file)}
              aria-label={`Voir ${file.name || "le fichier"}`}
            >
              <ImagePreview file={file} fill className="object-cover" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
