"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  ChevronUp,
  Activity,
  HelpCircle,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { FollowupBadge } from "@/components/followup-badge";
import { canAccessAdmin } from "@/lib/permissions";

interface AppSidebarProps {
  user: User;
  profile: Profile | null;
}

export function AppSidebar({ user, profile }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor";
  const canAccessAdminArea = canAccessAdmin(profile?.role);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const clientNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Mes projets",
      url: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Contact",
      url: "/contact",
      icon: HelpCircle,
    },
  ];

  const adminNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Projets",
      url: "/admin/projects",
      icon: FolderKanban,
    },
    {
      title: "Clients",
      url: "/admin/clients",
      icon: Users,
    },
    {
      title: "Activite",
      url: "/admin/logs",
      icon: Activity,
    },
  ];

  // Editors use the same nav as admins (access to CRM)
  const navItems = canAccessAdminArea ? adminNavItems : clientNavItems;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Horde"
              width={100}
              height={32}
              priority
            />
            {isAdmin && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono">
                ADMIN
              </span>
            )}
            {isEditor && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono">
                EDITOR
              </span>
            )}
          </Link>
          <NotificationBell side="right" align="start" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="section-label">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {canAccessAdminArea && item.url === "/admin/clients" && (
                        <FollowupBadge className="ml-auto" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(profile?.full_name || null, user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm flex-1 min-w-0">
                    <span className="font-medium truncate w-full">
                      {profile?.full_name || user.email}
                    </span>
                    {profile?.company && (
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {profile.company}
                      </span>
                    )}
                  </div>
                  <ChevronUp className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Parametres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Deconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
