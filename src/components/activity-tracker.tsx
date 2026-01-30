"use client";

import { useEffect, useRef } from "react";
import { logActivity } from "@/lib/activity";
import type { ActivityAction } from "@/types/database";

interface ActivityTrackerProps {
  action: ActivityAction;
  projectId?: string;
  deliverableId?: string;
  metadata?: Record<string, unknown>;
}

export function ActivityTracker({
  action,
  projectId,
  deliverableId,
  metadata,
}: ActivityTrackerProps) {
  const hasLogged = useRef(false);

  useEffect(() => {
    if (hasLogged.current) return;
    hasLogged.current = true;

    logActivity({
      action,
      projectId,
      deliverableId,
      metadata,
    });
  }, [action, projectId, deliverableId, metadata]);

  return null;
}
