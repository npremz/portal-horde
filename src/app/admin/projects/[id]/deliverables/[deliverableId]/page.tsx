"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { validateFile, validateComment } from "@/lib/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  FileText,
  ImageIcon,
  File,
  Download,
  Trash2,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Deliverable,
  FileRecord,
  Comment,
  Profile,
  DeliverableStatus,
} from "@/types/database";

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  pending_review: { label: "En attente de validation", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Valide", color: "bg-green-100 text-green-800" },
  revision_requested: { label: "Revision demandee", color: "bg-red-100 text-red-800" },
};

function getFileIcon(mimeType: string | null) {
  if (mimeType?.startsWith("image/")) return ImageIcon;
  if (mimeType?.includes("pdf")) return FileText;
  return File;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DeliverableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const deliverableId = params.deliverableId as string;

  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [files, setFiles] = useState<(FileRecord & { uploader?: Profile })[]>([]);
  const [comments, setComments] = useState<(Comment & { author?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCurrentUser(profile);
    }

    // Get deliverable
    const { data: deliverableData, error } = await supabase
      .from("deliverables")
      .select("*")
      .eq("id", deliverableId)
      .single();

    if (error || !deliverableData) {
      toast.error("Livrable introuvable");
      router.push(`/admin/projects/${projectId}`);
      return;
    }

    setDeliverable(deliverableData);

    // Get files
    const { data: filesData } = await supabase
      .from("files")
      .select("*, uploader:profiles(*)")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: false });

    setFiles(filesData || []);

    // Get comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*, author:profiles(*)")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: true });

    setComments(commentsData || []);
    setLoading(false);
  }, [deliverableId, projectId, router, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const uploadedFiles: string[] = [];

    for (const file of Array.from(fileList)) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${projectId}/${deliverableId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("deliverables")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Erreur upload: ${file.name}`);
        continue;
      }

      // Get max version for this deliverable
      const { data: maxVersion } = await supabase
        .from("files")
        .select("version")
        .eq("deliverable_id", deliverableId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const newVersion = (maxVersion?.version || 0) + 1;

      // Create file record
      const { error: dbError } = await supabase.from("files").insert({
        deliverable_id: deliverableId,
        name: file.name,
        storage_path: filePath,
        size_bytes: file.size,
        mime_type: file.type,
        version: newVersion,
        uploaded_by: currentUser?.id,
      });

      if (dbError) {
        toast.error(`Erreur DB: ${file.name}`);
        continue;
      }

      uploadedFiles.push(file.name);
    }

    if (uploadedFiles.length > 0) {
      toast.success(`${uploadedFiles.length} fichier(s) uploade(s)`);
      fetchData();
    }

    setUploading(false);
  }

  async function handleDeleteFile(file: FileRecord) {
    if (!confirm(`Supprimer "${file.name}" ?`)) return;

    // Delete from storage
    await supabase.storage.from("deliverables").remove([file.storage_path]);

    // Delete from database
    const { error } = await supabase.from("files").delete().eq("id", file.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Fichier supprime");
      fetchData();
    }
  }

  async function handleDownloadFile(file: FileRecord) {
    const { data } = await supabase.storage
      .from("deliverables")
      .createSignedUrl(file.storage_path, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function handleSendComment() {
    if (!newComment.trim()) return;

    // Validate comment
    const validation = validateComment(newComment);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSendingComment(true);

    const { error } = await supabase.from("comments").insert({
      deliverable_id: deliverableId,
      author_id: currentUser?.id,
      content: validation.sanitized,
    });

    if (error) {
      toast.error("Erreur lors de l'envoi");
    } else {
      setNewComment("");
      fetchData();
    }

    setSendingComment(false);
  }

  async function handleStatusChange(status: DeliverableStatus) {
    const { error } = await supabase
      .from("deliverables")
      .update({ status })
      .eq("id", deliverableId);

    if (error) {
      toast.error("Erreur lors de la mise a jour");
    } else {
      toast.success("Statut mis a jour");

      // Send notification to client when deliverable is ready for review
      if (status === "pending_review") {
        toast.promise(
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "pending_review",
              deliverableId,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error("Erreur envoi");
            return res.json();
          }),
          {
            loading: "Envoi de la notification au client...",
            success: "Notification envoyee au client",
            error: "Erreur lors de l'envoi de la notification",
          }
        );
      }

      fetchData();
    }
  }

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
    handleFileUpload(e.dataTransfer.files);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!deliverable) return null;

  const config = statusConfig[deliverable.status as keyof typeof statusConfig];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{deliverable.title}</h1>
            {deliverable.description && (
              <p className="text-muted-foreground">{deliverable.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={deliverable.status}
            onValueChange={(value) => handleStatusChange(value as DeliverableStatus)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending_review">En attente de validation</SelectItem>
              <SelectItem value="approved">Valide</SelectItem>
              <SelectItem value="revision_requested">Revision demandee</SelectItem>
            </SelectContent>
          </Select>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload zone */}
          <Card>
            <CardHeader>
              <CardTitle>Fichiers ({files.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag & drop zone */}
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
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  {uploading ? "Upload en cours..." : "Glisser-deposer ou cliquer pour uploader"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images, PDF, documents...
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file) => {
                    const Icon = getFileIcon(file.mime_type);
                    const isImage = file.mime_type?.startsWith("image/");

                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {isImage ? (
                          <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                            <ImagePreview file={file} supabase={supabase} />
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
                            {file.uploader && ` • ${file.uploader.full_name || file.uploader.email}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Comments */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Commentaires ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment list */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun commentaire
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author?.full_name || comment.author?.email || "Anonyme"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString("fr-BE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm bg-muted rounded-lg p-3">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* New comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="w-full"
                >
                  {sendingComment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Image preview component
function ImagePreview({ file, supabase }: { file: FileRecord; supabase: ReturnType<typeof createClient> }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getUrl() {
      const { data } = await supabase.storage
        .from("deliverables")
        .createSignedUrl(file.storage_path, 3600);
      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    }
    getUrl();
  }, [file.storage_path, supabase]);

  if (!url) return <div className="h-full w-full bg-muted animate-pulse" />;

  return (
    <Image
      src={url}
      alt={file.name}
      fill
      className="object-cover"
    />
  );
}
