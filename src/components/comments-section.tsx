"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FormFieldError } from "@/components/ui/form-field-error";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { validateComment } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import type { Comment, Profile } from "@/types/database";

interface CommentWithAuthor extends Comment {
  author?: Profile;
}

interface CommentsSectionProps {
  comments: CommentWithAuthor[];
  currentUserId?: string;
  onSendComment: (content: string) => Promise<void>;
  isHighlightCurrentUser?: boolean;
}

export function CommentsSection({
  comments,
  currentUserId,
  onSendComment,
  isHighlightCurrentUser = true,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    const validation = validateComment(newComment);
    if (!validation.valid) {
      setError(validation.error ?? "");
      return;
    }

    setSending(true);
    try {
      await onSendComment(validation.sanitized);
      setNewComment("");
      setError("");
    } catch {
      // Keep comment content on failure so user doesn't lose their text
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Commentaires ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              <MessageSquare className="h-10 w-10 mx-auto mb-2" />
              <p>Aucun commentaire</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCurrentUser = isHighlightCurrentUser && comment.author_id === currentUserId;
              return (
                <div key={comment.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                      {comment.author?.full_name || comment.author?.email || "Anonyme"}
                      {isCurrentUser && " (vous)"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
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

        <div className="space-y-2">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => setError("")}
            aria-invalid={!!error}
            rows={3}
          />
          <FormFieldError error={error} />
          <Button
            onClick={handleSend}
            disabled={!newComment.trim() || sending}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
