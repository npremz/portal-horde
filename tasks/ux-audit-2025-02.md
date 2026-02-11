# Audit UX/UI - Horde Portal (Février 2025)

Audit réalisé par 4 agents spécialisés couvrant : composants UI & design system, formulaires & interactions, architecture & navigation, accessibilité & bonnes pratiques.

---

## Top 10 - Améliorations prioritaires

| # | Problème | Impact | Effort |
|---|----------|--------|--------|
| 1 | **Aucun `loading.tsx`** dans l'app — navigation entre pages sans feedback visuel | Critique UX | Faible |
| 2 | **Inputs sans labels accessibles** (LinksSection, CommentsSection, ValidationCard, FileUploadZone) | Critique A11y | Faible |
| 3 | **Textes en anglais** dans les composants UI ("Close", "Toggle Sidebar", "Toggle theme") | Critique A11y | Faible |
| 4 | **LinksSection sans validation** ni loading state ni protection double-click | Haute UX | Moyen |
| 5 | **Boutons "Annuler"** dans 4 dialogs bypass le dirty check (`setOpen(false)` au lieu de `handleOpenChange`) | Haute UX | Faible |
| 6 | **Couleurs hardcodées** (`bg-yellow-50`, `bg-white`, etc.) cassent le dark mode | Haute UI | Moyen |
| 7 | **Contraste insuffisant** muted-foreground (#4C4B4B) sur fond clair — ratio ~3.7:1 < 4.5:1 WCAG AA | Haute A11y | Faible |
| 8 | **Nav client "Mes projets"** pointe vers `/dashboard` (doublon avec "Dashboard") | Haute UX | Faible |
| 9 | **Pas d'`aria-describedby`** reliant les inputs à leurs messages d'erreur | Moyenne A11y | Moyen |
| 10 | **`validateSocials()` jamais utilisée** — URLs réseaux sociaux non validées au submit | Moyenne UX | Faible |

---

## Quick Wins (effort faible, fort impact)

### 1. Ajouter `loading.tsx` aux groupes de routes
- Créer `src/app/(dashboard)/loading.tsx` et `src/app/admin/loading.tsx`
- Skeleton screens cohérents avec le contenu (header + cards/table placeholder)
- Active automatiquement le Suspense boundary de Next.js

### 2. Traduire les textes anglais restants
- `dialog.tsx:114` — "Close" → "Fermer"
- `theme-toggle.tsx:36` — "Toggle theme" → "Changer le thème"
- `sidebar.tsx:199` — "Sidebar" / "Displays the mobile sidebar." → texte français
- `sidebar.tsx:277,289` — "Toggle Sidebar" → "Ouvrir/Fermer la barre latérale"
- `sheet.tsx:80` — sr-only "Close" → "Fermer"

### 3. Corriger les accents manquants
- **Sidebar** : "Activite" → "Activité", "Cles API" → "Clés API", "Parametres" → "Paramètres", "Deconnexion" → "Déconnexion"
- **AlertDialogs** : "Modifications non sauvegardees" → "sauvegardées", "Continuer l'edition" → "l'édition"
- **validation.ts** : "etre" → "être", "caracteres" → "caractères"

### 4. Corriger les boutons "Annuler" des dialogs
Remplacer `onClick={() => setOpen(false)}` par `onClick={() => handleOpenChange(false)}` dans :
- `create-client-dialog.tsx`
- `invite-client-dialog.tsx`
- `create-user-dialog.tsx`
- `send-message-dialog.tsx`

### 5. Corriger la nav client doublon
- Supprimer l'item "Mes projets" qui pointe vers `/dashboard` (même URL que "Dashboard")
- Ou créer une vraie page `/projects` dédiée

### 6. Ajouter `aria-label` sur les boutons icon-only manquants
- `admin/clients/page.tsx:355-366` — bouton Star (priorité) mobile
- `admin/clients/page.tsx:642-645` — bouton Eye (voir client)
- Vérifier tous les boutons avec uniquement une icône

### 7. Améliorer le contraste muted-foreground
- Changer `--muted-foreground` de `#4C4B4B` à `#3D3C3C` (ratio ~4.6:1, conforme AA)
- Retirer `opacity: 0.7` sur `.section-label` ou ajuster la couleur de base

### 8. Ajouter `role="alert"` sur le message login
- `login/page.tsx:88-96` — ajouter `role="alert"` sur le div de message d'erreur/succès

---

## Améliorations majeures (effort moyen)

### 9. LinksSection — refonte complète
- Ajouter validation des champs titre et URL (utiliser les validators existants)
- Ajouter `<Label>` associés aux inputs (pas juste des placeholders)
- Ajouter loading state + disabled sur le bouton "Ajouter"
- Intégrer la confirmation AlertDialog directement dans le composant pour la suppression

### 10. Système de tokens de couleurs pour les statuts
- Créer des CSS variables `--color-status-warning`, `--color-status-success`, `--color-status-danger`, `--color-status-info`
- Avec variantes dark mode
- Remplacer tous les `bg-yellow-50`, `bg-green-100`, `text-blue-600` hardcodés dans `constants.ts` et les composants métier
- Corriger `links-section.tsx:62` — `bg-white` → `bg-card`

### 11. `aria-describedby` sur tous les champs de formulaire
Pattern à propager :
```tsx
<Input id="email" aria-describedby={errors.email ? "email-error" : undefined} />
<FormFieldError id="email-error" error={errors.email} />
```
Concerne : `client-form.tsx`, `create-client-dialog.tsx`, `invite-client-dialog.tsx`, `create-user-dialog.tsx`, `contacts-section.tsx`, `send-message-dialog.tsx`

### 12. FileGallery — accessibilité clavier
- `file-list.tsx:113-116` — le `<div onClick>` doit devenir `<button>` ou avoir `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)

### 13. FileUploadZone — label accessible
- `file-upload-zone.tsx:77-83` — ajouter `aria-label="Téléverser des fichiers"` sur l'input file caché

### 14. Gestion d'erreurs réseau dans CommentsSection
- Ne pas reset la textarea si l'envoi échoue (`comments-section.tsx:44`)
- Ajouter try/catch + toast.error dans `validation-card.tsx:28-33`

### 15. Confirmations pour actions impactantes
- Changement de statut deliverable/phase (surtout "pending_review" qui envoie un email)
- Changement de rôle utilisateur
- Désactivation de clé API

### 16. Scroll vers la première erreur
Dans les formulaires longs (ClientForm avec 3 Cards), scroller automatiquement vers le premier champ en erreur.

---

## Améliorations structurelles (effort élevé, vision long terme)

### 17. Hook `useFormDialog` mutualisé
Extraire la logique partagée par 6+ composants :
- `useState<Record<string, string>>({})` pour les erreurs
- `clearError(field)` helper
- `isDirty()` check (standardiser sur `JSON.stringify`)
- AlertDialog de confirmation à la fermeture
- Loading state + disabled pendant submit
- Reset du formulaire à la fermeture

### 18. Migration vers des Server Components avec Suspense
Les pages admin ("use client" + fetch dans useEffect) pourraient migrer vers des Server Components avec `loading.tsx` pour une meilleure performance perçue.

### 19. Sidebar navigation avec `<nav>` landmark
- `app-sidebar.tsx` — envelopper la liste de navigation dans un `<nav aria-label="Navigation principale">`
- Ajouter `aria-current="page"` sur les liens actifs (en plus de `data-active`)

### 20. Not-found contextuels
- Créer `src/app/(dashboard)/not-found.tsx` et `src/app/admin/not-found.tsx`
- Maintient la sidebar visible quand l'utilisateur arrive sur une URL inexistante

### 21. Route `/admin` manquante
- Ajouter `src/app/admin/page.tsx` avec redirect vers `/admin/dashboard`
- Corriger `admin/error.tsx` qui pointe vers `/admin` (page inexistante)

### 22. Metadata dynamiques
- Ajouter `export const metadata` ou `generateMetadata()` aux pages pour des `<title>` pertinents
- Améliorer le SEO avec Open Graph tags

### 23. Onboarding client
- Message d'accueil plus chaleureux quand un client n'a aucun projet
- Explication du portail et de ce qu'il peut y faire

---

## Scores par domaine

| Domaine | Score | Résumé |
|---------|-------|--------|
| Design System & Tokens | 7/10 | Bonne base (3 polices, thème complet) mais couleurs hardcodées partout |
| Composants UI | 8.5/10 | Solide base shadcn/ui, quelques textes anglais |
| Formulaires & Validation | 7.5/10 | Pattern cohérent mais LinksSection et quelques gaps |
| Feedback utilisateur | 8.5/10 | Toasts systématiques, AlertDialog partout, manque quelques confirmations |
| Loading & Performance | 5/10 | Pas de loading.tsx = point faible majeur |
| Navigation & Architecture | 7/10 | Bonne structure mais doublon nav client, route admin manquante |
| Accessibilité | 6/10 | Bonnes bases (skip link, focus-visible, touch targets) mais labels et contraste insuffisants |
| Responsive | 8/10 | Bon travail d'adaptation, quelques grilles à ajuster |
| Internationalisation | 7/10 | Français quasi-partout, accents manquants et textes anglais résiduels |

**Score global : 7.2/10**
