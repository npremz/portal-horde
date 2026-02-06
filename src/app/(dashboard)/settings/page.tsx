"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateName } from "@/lib/validation";
import { FormFieldError } from "@/components/ui/form-field-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Building, Mail, Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || "");
      setCompany(profileData.company || "");
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfile();
  }, [fetchProfile]);

  async function handleSaveProfile() {
    if (!profile) return;

    const newErrors: Record<string, string> = {};
    if (fullName.trim()) {
      const validation = validateName(fullName);
      if (!validation.valid) newErrors.fullName = validation.error!;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        company: company.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour");
      fetchProfile();
    }

    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setUploadingAvatar(true);

    // Upload to public avatars bucket
    const fileExt = file.name.split(".").pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    if (profile.avatar_url && profile.avatar_url.includes("/avatars/")) {
      const oldFileName = profile.avatar_url.split("/avatars/").pop();
      if (oldFileName) {
        await supabase.storage.from("avatars").remove([oldFileName]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Erreur lors de l'upload: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Photo de profil mise à jour");
      fetchProfile();
    }

    setUploadingAvatar(false);
  }

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display uppercase">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Ces informations sont visibles par l&apos;équipe Horde
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.full_name, profile.email)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </div>
            <div>
              <p className="font-medium">{profile.full_name || profile.email}</p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur l&apos;icône pour changer votre photo
              </p>
            </div>
          </div>

          <Separator />

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="inline h-4 w-4 mr-2" />
                Nom complet
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({}); }}
                placeholder="Jean Dupont"
                aria-invalid={!!errors.fullName}
              />
              <FormFieldError error={errors.fullName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                <Building className="inline h-4 w-4 mr-2" />
                Entreprise
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ma Société SPRL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L&apos;email ne peut pas être modifié. Contactez-nous si besoin.
              </p>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Membre depuis</p>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString("fr-BE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="font-medium mb-2">Besoin d&apos;aide ?</p>
            <Button variant="outline" asChild>
              <a href="/contact">Nous contacter</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
