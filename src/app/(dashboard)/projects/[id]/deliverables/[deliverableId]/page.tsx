"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";
import { validateComment } from "@/lib/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  File,
  Download,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
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

export default function ClientDeliverablePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const deliverableId = params.deliverableId as string;

  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [files, setFiles] = useState<(FileRecord & { uploader?: Profile })[]>([]);
  const [comments, setComments] = useState<(Comment & { author?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const hasLoggedView = useRef(false);

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
      router.push(`/projects/${projectId}`);
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

    // Log view activity (only once)
    if (!hasLoggedView.current && deliverableData) {
      hasLoggedView.current = true;
      logActivity({
        action: "view_deliverable",
        projectId,
        deliverableId,
        metadata: { title: deliverableData.title },
      });
    }
  }, [deliverableId, projectId, router, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDownloadFile(file: FileRecord) {
    const { data } = await supabase.storage
      .from("deliverables")
      .createSignedUrl(file.storage_path, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
      logActivity({
        action: "download_file",
        projectId,
        deliverableId,
        metadata: { fileName: file.name, fileId: file.id },
      });
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
      logActivity({
        action: "add_comment",
        projectId,
        deliverableId,
      });
      fetchData();
    }

    setSendingComment(false);
  }

  async function handleValidation(approved: boolean) {
    setUpdatingStatus(true);

    const newStatus: DeliverableStatus = approved ? "approved" : "revision_requested";

    const { error } = await supabase
      .from("deliverables")
      .update({ status: newStatus })
      .eq("id", deliverableId);

    if (error) {
      toast.error("Erreur lors de la mise a jour");
    } else {
      toast.success(approved ? "Livrable valide !" : "Demande de revision envoyee");

      // Log validation activity
      logActivity({
        action: approved ? "validate_deliverable" : "request_revision",
        projectId,
        deliverableId,
        metadata: { deliverableTitle: deliverable?.title },
      });

      // Notify admins of client decision
      toast.promise(
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newStatus,
            deliverableId,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error("Erreur envoi");
          return res.json();
        }),
        {
          loading: "Notification de l'equipe...",
          success: "Equipe notifiee",
          error: "Erreur lors de la notification",
        }
      );

      fetchData();
    }

    setUpdatingStatus(false);
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
  const canValidate = deliverable.status === "pending_review";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
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
        <Badge className={config.color}>{config.label}</Badge>
      </div>

      {/* Validation buttons */}
      {canValidate && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Ce livrable attend votre validation</p>
              <p className="text-sm text-muted-foreground">
                Verifiez les fichiers et validez ou demandez des modifications
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleValidation(false)}
                disabled={updatingStatus}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Demander revision
              </Button>
              <Button
                onClick={() => handleValidation(true)}
                disabled={updatingStatus}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Valider
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - Files */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fichiers ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucun fichier pour ce livrable
                </p>
              ) : (
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
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Telecharger
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image gallery for image files */}
          {files.some((f) => f.mime_type?.startsWith("image/")) && (
            <Card>
              <CardHeader>
                <CardTitle>Apercu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {files
                    .filter((f) => f.mime_type?.startsWith("image/"))
                    .map((file) => (
                      <div
                        key={file.id}
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <ImagePreview file={file} supabase={supabase} fill />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                  comments.map((comment) => {
                    const isCurrentUser = comment.author_id === currentUser?.id;
                    return (
                      <div key={comment.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                            {comment.author?.full_name || comment.author?.email || "Anonyme"}
                            {isCurrentUser && " (vous)"}
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
                        <p className={`text-sm rounded-lg p-3 ${
                          isCurrentUser ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {comment.content}
                        </p>
                      </div>
                    );
                  })
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
function ImagePreview({
  file,
  supabase,
  fill = false
}: {
  file: FileRecord;
  supabase: ReturnType<typeof createClient>;
  fill?: boolean;
}) {
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
      fill={fill}
      width={fill ? undefined : 48}
      height={fill ? undefined : 48}
      className="object-cover"
    />
  );
}
