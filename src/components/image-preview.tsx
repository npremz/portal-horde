"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { FileRecord } from "@/types/database";

interface ImagePreviewProps {
  file: FileRecord;
  fill?: boolean;
  className?: string;
}

export function ImagePreview({ file, fill = false, className }: ImagePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const supabase = createClient();

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

  if (!url) {
    return <div className="h-full w-full bg-muted animate-pulse" />;
  }

  return (
    <Image
      src={url}
      alt={file.name}
      fill={fill}
      width={fill ? undefined : 48}
      height={fill ? undefined : 48}
      className={className || "object-cover"}
    />
  );
}
