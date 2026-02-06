import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export function uploadWithProgress(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<{ error: Error | null }> {
  return new Promise(async (resolve) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      resolve({ error: new Error("Non authentifié") });
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ error: null });
      } else {
        resolve({ error: new Error(`Upload échoué (${xhr.status})`) });
      }
    };

    xhr.onerror = () => {
      resolve({ error: new Error("Erreur réseau lors de l'upload") });
    };

    xhr.send(file);
  });
}
