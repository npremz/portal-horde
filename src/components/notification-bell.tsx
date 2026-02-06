"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, ChevronRight, FileText, MessageSquare, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationType } from "@/types/database";

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  deliverable_ready: <FileText className="h-4 w-4 text-yellow-600" />,
  deliverable_validated: <Check className="h-4 w-4 text-green-600" />,
  revision_requested: <XCircle className="h-4 w-4 text-red-600" />,
  new_comment: <MessageSquare className="h-4 w-4 text-blue-600" />,
};

interface NotificationBellProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function NotificationBell({ side = "bottom", align = "end" }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "A l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side={side} align={align} sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const icon = notificationIcons[notification.type as NotificationType];
                const isUnread = !notification.read_at;

                const hasLink = !!notification.link;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      isUnread ? "bg-muted/30" : ""
                    } ${hasLink ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-0.5">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isUnread ? "font-medium" : ""}`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {isUnread && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        {hasLink && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
