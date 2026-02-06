"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDeliverableData } from "@/hooks/use-deliverable-data";
import { validateFile, validateComment } from "@/lib/validation";
import { deliverableStatusConfig } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommentsSection } from "@/components/comments-section";
import { FileList } from "@/components/file-list";
import { LinksSection } from "@/components/links-section";
import { FileUploadZone } from "@/components/file-upload-zone";
import type { FileUploadProgress } from "@/components/file-upload-zone";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { DeliverableStatus, FileRecord, Link as LinkType } from "@/types/database";

export default function AdminDeliverablePage() {
  const params = useParams();
  const projectId = params.id as string;
  const deliverableId = params.deliverableId as string;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);

  const {
    deliverable,
    files,
    links,
    comments,
    setComments,
    currentUser,
    loading,
    supabase,
    refetch,
  } = useDeliverableData({
    projectId,
    deliverableId,
    redirectOnError: `/admin/projects/${projectId}`,
  });

  async function handleFileUpload(fileList: FileList) {
    setUploading(true);
    const uploadedFiles: string[] = [];
    const filesArray = Array.from(fileList);
    const totalFiles = filesArray.length;

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${projectId}/${deliverableId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setUploadProgress({
        fileName: file.name,
        percent: 0,
        current: i + 1,
        total: totalFiles,
      });

      const { error: uploadError } = await uploadWithProgress(
        supabase,
        "deliverables",
        filePath,
        file,
        (progress) => {
          setUploadProgress({
            fileName: file.name,
            percent: progress.percent,
            current: i + 1,
            total: totalFiles,
          });
        }
      );

      if (uploadError) {
        toast.error(`Erreur upload: ${file.name}`);
        continue;
      }

      const { data: maxVersion } = await supabase
        .from("files")
        .select("version")
        .eq("deliverable_id", deliverableId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const newVersion = (maxVersion?.version || 0) + 1;

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
      toast.success(`${uploadedFiles.length} fichier(s) uploadé(s)`);
      refetch();
    }

    setUploadProgress(null);
    setUploading(false);
  }

  async function handleDeleteFile(file: FileRecord) {
    if (!confirm(`Supprimer "${file.name}" ?`)) return;

    await supabase.storage.from("deliverables").remove([file.storage_path]);

    const { error } = await supabase.from("files").delete().eq("id", file.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Fichier supprimé");
      refetch();
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

  async function handleAddLink(title: string, url: string) {
    const { error } = await supabase.from("links").insert({
      deliverable_id: deliverableId,
      title,
      url,
      created_by: currentUser?.id,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout du lien");
    } else {
      toast.success("Lien ajouté avec succès");
      refetch();
    }
  }

  async function handleDeleteLink(link: LinkType) {
    if (!confirm(`Supprimer le lien "${link.title}" ?`)) return;

    const { error } = await supabase.from("links").delete().eq("id", link.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Lien supprimé");
      refetch();
    }
  }

  async function handleSendComment(content: string) {
    const validation = validateComment(content);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      deliverable_id: deliverableId,
      author_id: currentUser?.id ?? null,
      content: validation.sanitized,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: currentUser ?? undefined,
    };
    setComments((prev) => [...prev, tempComment]);

    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({
        deliverable_id: deliverableId,
        author_id: currentUser?.id,
        content: validation.sanitized,
      })
      .select("*, author:profiles(*)")
      .single();

    if (error) {
      // Rollback optimistic insert
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      toast.error("Erreur lors de l'envoi");
      return;
    }

    // Replace temp with real comment
    setComments((prev) =>
      prev.map((c) => (c.id === tempId ? inserted : c))
    );

    // Notify client of new comment from admin (fire and forget)
    const { data: project } = await supabase
      .from("projects")
      .select("client_id, name")
      .eq("id", projectId)
      .single();

    const clientId = project?.client_id;
    if (clientId) {
      await supabase.from("notifications").insert({
        user_id: clientId,
        type: "new_comment" as const,
        title: `Nouveau commentaire de ${currentUser?.full_name || "l'équipe"}`,
        message: `${deliverable?.title} - ${project?.name}`,
        link: `/projects/${projectId}/deliverables/${deliverableId}`,
      });
    }
  }

  async function handleStatusChange(status: DeliverableStatus) {
    const { error } = await supabase
      .from("deliverables")
      .update({ status })
      .eq("id", deliverableId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    toast.success("Statut mis à jour");

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
          success: "Notification envoyée au client",
          error: "Erreur lors de l'envoi de la notification",
        }
      );
    }

    refetch();
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

  const config = deliverableStatusConfig[deliverable.status];

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
              <SelectItem value="approved">Validé</SelectItem>
              <SelectItem value="revision_requested">Révision demandée</SelectItem>
            </SelectContent>
          </Select>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - Files */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fichiers ({files.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone onUpload={handleFileUpload} uploading={uploading} progress={uploadProgress} />
              <FileList
                files={files}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                showUploader
              />
            </CardContent>
          </Card>

          <LinksSection
            links={links}
            onAddLink={handleAddLink}
            onDeleteLink={handleDeleteLink}
            canEdit
          />
        </div>

        {/* Sidebar - Comments */}
        <div className="space-y-6">
          <CommentsSection
            comments={comments}
            currentUserId={currentUser?.id}
            onSendComment={handleSendComment}
            isHighlightCurrentUser={false}
          />
        </div>
      </div>
    </div>
  );
}
