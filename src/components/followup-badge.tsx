"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface FollowupBadgeProps {
  className?: string;
}

export function FollowupBadge({ className }: FollowupBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const { count: followupCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .lte("next_followup_date", today)
        .not("next_followup_date", "is", null);

      setCount(followupCount || 0);
      setLoading(false);
    };

    fetchCount();

    // Refresh every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || count === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className={className}>
      {count}
    </Badge>
  );
}
