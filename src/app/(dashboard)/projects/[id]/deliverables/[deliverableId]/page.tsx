"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useDeliverableData } from "@/hooks/use-deliverable-data";
import { logActivity } from "@/lib/activity";
import { validateComment } from "@/lib/validation";
import { deliverableStatusConfig } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsSection } from "@/components/comments-section";
import { FileList, FileGallery } from "@/components/file-list";
import { LinksSection } from "@/components/links-section";
import { ValidationCard } from "@/components/validation-card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { DeliverableStatus, FileRecord } from "@/types/database";

export default function ClientDeliverablePage() {
  const params = useParams();
  const projectId = params.id as string;
  const deliverableId = params.deliverableId as string;

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
    redirectOnError: `/projects/${projectId}`,
    logView: true,
  });

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

    logActivity({
      action: "add_comment",
      projectId,
      deliverableId,
    });

    // Notify admins of new comment (fire and forget)
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        type: "new_comment" as const,
        title: `Nouveau commentaire de ${currentUser?.full_name || "un client"}`,
        message: `${deliverable?.title}`,
        link: `/admin/projects/${projectId}/deliverables/${deliverableId}`,
      }));

      await supabase.from("notifications").insert(notifications);
    }
  }

  async function handleValidation(approved: boolean, comment?: string) {
    const newStatus: DeliverableStatus = approved ? "approved" : "revision_requested";

    const { error } = await supabase
      .from("deliverables")
      .update({ status: newStatus })
      .eq("id", deliverableId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    // Add revision comment if provided
    if (!approved && comment?.trim()) {
      await supabase.from("comments").insert({
        deliverable_id: deliverableId,
        author_id: currentUser?.id,
        content: comment.trim(),
      });

      // Notify admins of comment
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          type: "new_comment" as const,
          title: `Commentaire de révision de ${currentUser?.full_name || "un client"}`,
          message: `${deliverable?.title}`,
          link: `/admin/projects/${projectId}/deliverables/${deliverableId}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    toast.success(approved ? "Livrable validé !" : "Demande de révision envoyée");

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
        loading: "Notification de l'équipe...",
        success: "Équipe notifiée",
        error: "Erreur lors de la notification",
      }
    );

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
  const canValidate = deliverable.status === "pending_review";

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon" className="shrink-0 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl md:text-2xl font-semibold">{deliverable.title}</h1>
            <Badge className={`${config.color} shrink-0`}>{config.label}</Badge>
          </div>
          {deliverable.description && (
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {deliverable.description}
            </p>
          )}
        </div>
      </div>

      {/* Validation buttons */}
      {canValidate && <ValidationCard onValidate={handleValidation} />}

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Main content - Files */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fichiers ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <FileList files={files} onDownload={handleDownloadFile} />
            </CardContent>
          </Card>

          <FileGallery files={files} onFileClick={handleDownloadFile} />

          <LinksSection links={links} />
        </div>

        {/* Sidebar - Comments */}
        <div className="space-y-6">
          <CommentsSection
            comments={comments}
            currentUserId={currentUser?.id}
            onSendComment={handleSendComment}
          />
        </div>
      </div>
    </div>
  );
}
