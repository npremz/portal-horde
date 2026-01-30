"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import type {
  Deliverable,
  FileRecord,
  Link,
  Comment,
  Profile,
} from "@/types/database";

interface FileWithUploader extends FileRecord {
  uploader?: Profile;
}

interface LinkWithCreator extends Link {
  creator?: Profile;
}

interface CommentWithAuthor extends Comment {
  author?: Profile;
}

interface UseDeliverableDataOptions {
  projectId: string;
  deliverableId: string;
  redirectOnError?: string;
  logView?: boolean;
}

interface UseDeliverableDataReturn {
  deliverable: Deliverable | null;
  files: FileWithUploader[];
  links: LinkWithCreator[];
  comments: CommentWithAuthor[];
  currentUser: Profile | null;
  loading: boolean;
  supabase: ReturnType<typeof createClient>;
  refetch: () => Promise<void>;
}

export function useDeliverableData({
  projectId,
  deliverableId,
  redirectOnError,
  logView = false,
}: UseDeliverableDataOptions): UseDeliverableDataReturn {
  const router = useRouter();
  const supabase = createClient();

  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [files, setFiles] = useState<FileWithUploader[]>([]);
  const [links, setLinks] = useState<LinkWithCreator[]>([]);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoggedView = useRef(false);

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
      if (redirectOnError) {
        router.push(redirectOnError);
      }
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

    // Get links
    const { data: linksData } = await supabase
      .from("links")
      .select("*, creator:profiles(*)")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: false });

    setLinks(linksData || []);

    // Get comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*, author:profiles(*)")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: true });

    setComments(commentsData || []);
    setLoading(false);

    // Log view activity (only once)
    if (logView && !hasLoggedView.current && deliverableData) {
      hasLoggedView.current = true;
      logActivity({
        action: "view_deliverable",
        projectId,
        deliverableId,
        metadata: { title: deliverableData.title },
      });
    }
  }, [deliverableId, projectId, router, supabase, redirectOnError, logView]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    deliverable,
    files,
    links,
    comments,
    currentUser,
    loading,
    supabase,
    refetch: fetchData,
  };
}
