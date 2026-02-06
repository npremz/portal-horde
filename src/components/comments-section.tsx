"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Send, Loader2, MessageSquare } from "lucide-react";
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

  async function handleSend() {
    if (!newComment.trim()) return;

    setSending(true);
    await onSendComment(newComment);
    setNewComment("");
    setSending(false);
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
            rows={3}
          />
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
