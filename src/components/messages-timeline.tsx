"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail, Clock, User, MousePointerClick, Send } from "lucide-react";
import { messageTypeConfig } from "@/lib/constants";
import type { ClientMessage } from "@/types/database";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface MessagesTimelineProps {
  messages: ClientMessage[];
}

function TrackingBadges({ message }: { message: ClientMessage }) {
  // No tracking for old messages without resend_email_id
  if (!message.resend_email_id) return null;

  return (
    <div className="flex items-center gap-1.5">
      {message.clicked_at ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
              <MousePointerClick className="h-3 w-3" />
              Cliqué
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cliqué le {format(new Date(message.clicked_at), "d MMM yyyy à HH:mm", { locale: fr })}</p>
            {message.clicked_link && (
              <p className="text-muted-foreground mt-0.5 truncate max-w-[300px]">{message.clicked_link}</p>
            )}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          <Send className="h-3 w-3" />
          Envoyé
        </Badge>
      )}
    </div>
  );
}

export function MessagesTimeline({ messages }: MessagesTimelineProps) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages envoyés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun message envoyé</p>
            <p className="text-sm mt-2">
              Utilisez le bouton ci-dessus pour envoyer votre premier message.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by sent_at descending (most recent first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Messages envoyés ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMessages.map((message, index) => (
            <div key={message.id}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{message.subject}</span>
                      <Badge
                        variant="secondary"
                        className={messageTypeConfig[message.message_type].color}
                      >
                        {messageTypeConfig[message.message_type].label}
                      </Badge>
                      <TrackingBadges message={message} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {message.contact ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {message.contact.name}
                          {message.contact.email && ` (${message.contact.email})`}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Email principal
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(message.sent_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-3 mt-2">
                  <p className="text-sm whitespace-pre-wrap line-clamp-4">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
