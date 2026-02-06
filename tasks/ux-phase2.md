# UX Phase 2 — Temps reel, progression & polish

Date: 2026-02-06
Ref: tasks/ux-audit.md

---

## Vue d'ensemble

4 chantiers, ordonnes par impact utilisateur:

1. ~~Commentaires en temps reel (Supabase channel)~~ DONE
2. ~~Barre de progression upload~~ DONE
3. ~~Confirmation avant fermeture de dialog avec contenu modifie~~ DONE
4. ~~Mises a jour optimistes (commentaires)~~ DONE

---

## 1. Commentaires en temps reel

### Objectif
Quand un admin et un client sont sur le meme livrable, chacun voit les nouveaux commentaires apparaitre instantanement sans refresh.

### Etat actuel
- `src/components/comments-section.tsx` : affiche une liste de commentaires passes en props, pas de subscription
- Les commentaires sont charges par la page parent (`admin/.../[deliverableId]/page.tsx` et `(dashboard)/.../[deliverableId]/page.tsx`) via une query Supabase au mount
- Aucun mecanisme de rafraichissement automatique

### Pattern a suivre
`src/hooks/use-notifications.ts` (lignes 35-75) utilise deja Supabase real-time :
```typescript
const channel = supabase
  .channel("notifications")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "notifications",
  }, (payload) => {
    setNotifications((prev) => [payload.new, ...prev].slice(0, 20));
  })
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

### Implementation

**Creer:** `src/hooks/use-realtime-comments.ts`

```typescript
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types/database";

export function useRealtimeComments(
  deliverableId: string,
  onNewComment: (comment: Comment) => void
) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${deliverableId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `deliverable_id=eq.${deliverableId}`,
      }, async (payload) => {
        // Charger le commentaire avec l'auteur
        const { data } = await supabase
          .from("comments")
          .select("*, author:profiles(id, full_name, avatar_url)")
          .eq("id", payload.new.id)
          .single();

        if (data) onNewComment(data);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, deliverableId, onNewComment]);
}
```

**Modifier:** les 2 pages livrables (admin + client)
- Ajouter `useRealtimeComments(deliverableId, handleNewComment)`
- `handleNewComment` : ajouter le commentaire a l'array **seulement si l'auteur n'est pas l'utilisateur courant** (eviter les doublons — le commentaire de l'utilisateur est deja ajoute localement apres l'insert)

### Fichiers concernes
- [ ] `src/hooks/use-realtime-comments.ts` (a creer)
- [ ] `src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx`
- [ ] `src/app/(dashboard)/projects/[id]/deliverables/[deliverableId]/page.tsx`

### Prerequis Supabase
- La table `comments` doit avoir `REPLICA IDENTITY FULL` ou au minimum les colonnes filtrees dans l'identite
- Verifier que les RLS policies autorisent le SELECT pour les utilisateurs connectes

---

## 2. Barre de progression upload

### Objectif
L'utilisateur voit la progression de chaque fichier pendant l'upload au lieu d'un simple "Upload en cours...".

### Etat actuel
- `src/components/file-upload-zone.tsx` : affiche un boolean `uploading` (texte "Upload en cours...")
- Upload via `supabase.storage.from("deliverables").upload(filePath, file)` dans la page admin livrable
- Les fichiers sont uploades sequentiellement dans une boucle `for...of`
- Limite : 50MB par fichier (`src/lib/validation.ts` ligne 128)
- Le composant `Progress` de shadcn/ui est disponible dans `src/components/ui/progress.tsx`

### Probleme technique
Le client Supabase JS ne supporte **pas** les callbacks de progression sur `storage.upload()`. Il faut utiliser `XMLHttpRequest` ou `fetch` avec `ReadableStream` pour avoir un suivi de progression.

### Implementation

**Approche:** Utiliser `XMLHttpRequest` pour l'upload vers Supabase Storage, avec `upload.onprogress`.

**Creer:** `src/lib/upload-with-progress.ts`
```typescript
interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export function uploadWithProgress(
  url: string,
  file: File,
  token: string,
  onProgress: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "false");

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
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));

    const formData = new FormData();
    formData.append("", file); // Supabase storage format
    xhr.send(formData);
  });
}
```

**Modifier:** `src/components/file-upload-zone.tsx`
- Ajouter une prop `uploadProgress?: { fileName: string; percent: number }` (optionnel)
- Afficher une barre `<Progress value={percent} />` avec le nom du fichier quand disponible
- Afficher "2 / 5 fichiers" si upload multiple

**Modifier:** `src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx`
- Remplacer `supabase.storage.upload()` par `uploadWithProgress()`
- Ajouter un state `uploadProgress` passe a `FileUploadZone`
- Afficher le fichier en cours + progression

### Fichiers concernes
- [ ] `src/lib/upload-with-progress.ts` (a creer)
- [ ] `src/components/file-upload-zone.tsx`
- [ ] `src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx`

### UI cible
```
┌──────────────────────────────────────┐
│  📄 maquette-v2.psd                 │
│  ██████████████░░░░░░  72%           │
│  Fichier 2 / 5                       │
└──────────────────────────────────────┘
```

---

## 3. Confirmation avant fermeture de dialog avec contenu modifie

### Objectif
Empecher la perte accidentelle de donnees quand l'utilisateur ferme un dialog contenant un formulaire modifie.

### Etat actuel
Tous les dialogs avec formulaires se ferment sans avertissement, meme si l'utilisateur a rempli des champs :
- `CreateClientDialog` — reset silencieux dans `handleOpenChange` (ligne 167-173)
- `CreateUserDialog` — reset silencieux dans `handleOpenChange` (ligne 118-124)
- `SendMessageDialog` — reset silencieux dans `handleOpenChange` (ligne 207-216)
- `InviteClientDialog` — pas de `handleOpenChange`, `onOpenChange={setOpen}` direct
- `ContactsSection` — dialog add/edit, `onOpenChange={setDialogOpen}` direct

### Implementation

**Creer:** `src/hooks/use-dirty-form.ts`
```typescript
import { useState, useCallback, useRef } from "react";

export function useDirtyForm<T extends Record<string, unknown>>(initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const initialRef = useRef<T>(initialValues);

  const isDirty = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialRef.current);
  }, [formData]);

  const reset = useCallback((newInitial?: T) => {
    const values = newInitial ?? initialRef.current;
    initialRef.current = values;
    setFormData(values);
  }, []);

  return { formData, setFormData, isDirty, reset };
}
```

**Pattern pour chaque dialog :**
```tsx
const [showCloseConfirm, setShowCloseConfirm] = useState(false);

const handleOpenChange = (newOpen: boolean) => {
  if (!newOpen && isDirty()) {
    setShowCloseConfirm(true);
    return;
  }
  setOpen(newOpen);
  if (!newOpen) reset();
};

// Dans le JSX, apres le Dialog :
<AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Modifications non sauvegardees</AlertDialogTitle>
      <AlertDialogDescription>
        Vous avez des modifications non sauvegardees. Voulez-vous vraiment fermer ?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Continuer l&apos;edition</AlertDialogCancel>
      <AlertDialogAction onClick={() => { setOpen(false); reset(); }}>
        Fermer sans sauvegarder
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Dialogs concernes (par priorite)
- [ ] `src/components/send-message-dialog.tsx` — le plus long formulaire, perte la plus couteuse
- [ ] `src/components/create-client-dialog.tsx` — 12 champs, perte frustrante
- [ ] `src/components/contacts-section.tsx` — dialog add/edit contact
- [ ] `src/components/create-user-dialog.tsx` — 4 champs
- [ ] `src/components/invite-client-dialog.tsx` — 3 champs

### Ce qui ne change PAS
- `AlertDialog` est deja importe et utilise (contacts-section.tsx)
- Pas besoin de nouveau composant UI

---

## 4. Mises a jour optimistes

### Objectif
L'interface reagit instantanement aux actions de l'utilisateur au lieu d'attendre la reponse du serveur.

### Etat actuel
Toutes les mutations suivent le pattern : `setLoading(true)` → API call → `await` → refetch → `setLoading(false)`.
L'utilisateur voit un spinner pendant 200-800ms a chaque action.

### Candidats pour optimistic updates

**4.1 Ajout de commentaire** (impact fort)

Fichiers : les 2 pages livrables (admin + client)

Pattern actuel :
```
1. setLoading(true)
2. supabase.from("comments").insert(...)
3. await response
4. refetch()
5. setLoading(false)
```

Pattern optimiste :
```
1. Creer un commentaire temporaire avec id temp-{timestamp}
2. L'ajouter immediatement a la liste locale
3. Vider le champ de saisie
4. En arriere-plan : insert dans Supabase
5. Si succes : remplacer le temp par le vrai (id serveur)
6. Si erreur : retirer le temp + toast d'erreur + restaurer le contenu
```

**4.2 Suppression de contact** (impact moyen)

Fichier : `src/components/contacts-section.tsx`

Pattern optimiste :
```
1. Retirer le contact de la liste immediatement
2. En arriere-plan : delete dans Supabase
3. Si erreur : re-ajouter le contact + toast d'erreur
```

**4.3 Toggle statut livrable** (impact moyen)

Le changement de statut d'un livrable (approve/reject) pourrait etre optimiste, mais c'est une action critique. A evaluer.

### Implementation progressive
Commencer par les commentaires (4.1) car :
- C'est l'action la plus frequente
- Le feedback instantane ameliore fortement le ressenti
- Se combine naturellement avec le chantier 1 (temps reel)
- Risque faible : un commentaire temporaire qui disparait en cas d'erreur est acceptable

### Fichiers concernes
- [ ] `src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx` (handleSendComment)
- [ ] `src/app/(dashboard)/projects/[id]/deliverables/[deliverableId]/page.tsx` (handleSendComment)
- [ ] `src/components/contacts-section.tsx` (handleDelete)

---

## Ordre d'implementation

1. **Commentaires temps reel** (hook + 2 pages) — fondation pour le chantier 4
2. **Upload avec progression** (util + composant + page admin)
3. **Mises a jour optimistes commentaires** — se greffe sur le chantier 1
4. **Confirmation fermeture dialogs** (hook + 5 dialogs) — independant, peut etre fait en parallele avec 2-3

---

## Verification

- [ ] `npm test` passe apres chaque chantier
- [ ] `npm run build` passe
- [ ] Tester temps reel : ouvrir 2 onglets (admin + client) sur le meme livrable, envoyer un commentaire
- [ ] Tester upload : uploader un fichier >5MB, verifier la barre de progression
- [ ] Tester upload : uploader plusieurs fichiers, verifier le compteur "X / Y"
- [ ] Tester dirty dialog : remplir un formulaire, cliquer hors du dialog, verifier la confirmation
- [ ] Tester dirty dialog : ouvrir un dialog, ne rien modifier, fermer → pas de confirmation
- [ ] Tester optimistic : envoyer un commentaire, verifier qu'il apparait immediatement
- [ ] Tester optimistic error : couper le reseau, envoyer un commentaire, verifier le rollback
- [ ] Verifier le dark mode sur tous les changements
- [ ] Verifier le mobile
