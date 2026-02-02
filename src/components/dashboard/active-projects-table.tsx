"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban } from "lucide-react";
import type { ProjectStatus } from "@/types/database";

interface ProjectItem {
  id: string;
  name: string;
  status: ProjectStatus;
  client_name: string | null;
  progress: number;
}

interface ActiveProjectsTableProps {
  projects?: ProjectItem[];
  loading?: boolean;
}

export function ActiveProjectsTable({ projects, loading }: ActiveProjectsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="md:hidden">Projets</span>
            <span className="hidden md:inline">Projets actifs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 md:h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <FolderKanban className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="md:hidden">Projets</span>
          <span className="hidden md:inline">Projets actifs</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {!projects || projects.length === 0 ? (
          <div className="py-6 md:py-8 text-center text-muted-foreground text-xs md:text-sm">
            Aucun projet actif
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs md:text-sm truncate">{project.name}</p>
                    {project.client_name && (
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                        {project.client_name}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-muted-foreground shrink-0 ml-2">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-1 md:h-1.5" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
