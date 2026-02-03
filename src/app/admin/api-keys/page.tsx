"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Key } from "lucide-react";
import { CreateKeyDialog } from "./components/create-key-dialog";
import { ApiKeysTable } from "./components/api-keys-table";
import type { ApiKey } from "@/types/database";

type ApiKeyWithProfile = ApiKey & {
  profile?: { id: string; full_name: string | null; email: string };
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/api-keys");
      const data = await response.json();

      if (response.ok) {
        setKeys(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display uppercase flex items-center gap-2">
            <Key className="h-6 w-6" />
            Cles API
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerez les cles d&apos;acces pour les bots et agents
          </p>
        </div>
        <CreateKeyDialog onKeyCreated={() => fetchKeys()} />
      </div>

      <ApiKeysTable keys={keys} onRefresh={() => fetchKeys()} />
    </div>
  );
}
