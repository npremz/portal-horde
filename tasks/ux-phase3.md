# UX Phase 3 — Accessibilite & polish

Date: 2026-02-06
Ref: tasks/ux-audit.md

---

## Vue d'ensemble

7 chantiers, ordonnes par rapport effort/impact:

1. aria-labels sur les boutons icone (20+ boutons, rapide)
2. Skip to content link (2 layouts, rapide)
3. Breadcrumbs dans le parcours client (4 pages, composant deja pret)
4. prefers-reduced-motion (globals.css + tailwind)
5. Touch targets 44px minimum sur mobile (button variants)
6. Empty states plus engageants (14 instances)
7. Styles d'impression (globals.css)

---

## 1. aria-labels sur les boutons icone

### Objectif
Les lecteurs d'ecran doivent pouvoir identifier chaque bouton icone.

### Etat actuel
- 3 boutons ont deja un `sr-only` (menu mobile, theme toggle, sidebar toggle)
- 3 boutons dans `contacts-section.tsx` ont `title` mais pas `aria-label`
- 20+ boutons icone n'ont aucun label accessible

### Boutons a corriger

| Fichier | Ligne | Action | aria-label propose |
|---------|-------|--------|-------------------|
| `notification-bell.tsx` | 61 | Notifications | `"Notifications"` |
| `file-list.tsx` | 75 | Telecharger | `"Telecharger le fichier"` |
| `file-list.tsx` | 75 | Supprimer | `"Supprimer le fichier"` |
| `links-section.tsx` | 117 | Ouvrir lien | `"Ouvrir le lien"` |
| `links-section.tsx` | 127 | Supprimer lien | `"Supprimer le lien"` |
| `phase-templates-selector.tsx` | 206 | Monter phase | `"Monter la phase"` |
| `phase-templates-selector.tsx` | 216 | Descendre phase | `"Descendre la phase"` |
| `phase-templates-selector.tsx` | 251 | Retirer phase | `"Retirer la phase"` |
| `contacts-section.tsx` | 381 | Definir principal | ajouter `aria-label` en plus du `title` |
| `contacts-section.tsx` | 390 | Modifier contact | ajouter `aria-label` en plus du `title` |
| `contacts-section.tsx` | 398 | Supprimer contact | ajouter `aria-label` en plus du `title` |
| `admin/users/page.tsx` | 261 | Menu actions | `"Actions"` |
| `admin/projects/page.tsx` | 191 | Menu actions | `"Actions"` |
| `admin/projects/[id]/page.tsx` | 466 | Menu phase | `"Actions de la phase"` |
| `admin/projects/[id]/page.tsx` | 563 | Voir livrable | `"Voir le livrable"` |
| `admin/projects/[id]/edit/page.tsx` | 156 | Retour | `"Retour au projet"` |
| `(dashboard)/.../[deliverableId]/page.tsx` | 218 | Retour | `"Retour au projet"` |
| `admin/.../[deliverableId]/page.tsx` | 307 | Retour | `"Retour au projet"` |
| `admin/api-keys/.../api-keys-table.tsx` | 166 | Menu actions | `"Actions"` |
| `admin/api-keys/.../create-key-dialog.tsx` | 147 | Copier cle | `"Copier la cle"` |

### Implementation
Ajouter `aria-label="..."` a chaque `<Button size="icon">` ou `<Button variant="ghost" size="icon">`.

### Fichiers concernes
- [ ] `src/components/notification-bell.tsx`
- [ ] `src/components/file-list.tsx`
- [ ] `src/components/links-section.tsx`
- [ ] `src/components/phase-templates-selector.tsx`
- [ ] `src/components/contacts-section.tsx`
- [ ] `src/app/admin/users/page.tsx`
- [ ] `src/app/admin/projects/page.tsx`
- [ ] `src/app/admin/projects/[id]/page.tsx`
- [ ] `src/app/admin/projects/[id]/edit/page.tsx`
- [ ] `src/app/(dashboard)/projects/[id]/deliverables/[deliverableId]/page.tsx`
- [ ] `src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx`
- [ ] `src/app/admin/api-keys/components/api-keys-table.tsx`
- [ ] `src/app/admin/api-keys/components/create-key-dialog.tsx`

---

## 2. Skip to content link

### Objectif
Les utilisateurs clavier peuvent sauter la sidebar et atterrir directement sur le contenu.

### Etat actuel
- Aucun skip link
- Les layouts dashboard et admin ont un `<main>` mais sans `id`

### Implementation

**1. Ajouter `id="main-content"` dans les 2 layouts :**
- `src/app/(dashboard)/layout.tsx` ligne 35 : `<main id="main-content" ...>`
- `src/app/admin/layout.tsx` ligne 40 : `<main id="main-content" ...>`

**2. Ajouter le skip link dans `src/app/layout.tsx` :**
```tsx
<body>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring focus:shadow-lg"
  >
    Aller au contenu principal
  </a>
  ...
</body>
```

### Fichiers concernes
- [ ] `src/app/layout.tsx`
- [ ] `src/app/(dashboard)/layout.tsx`
- [ ] `src/app/admin/layout.tsx`

---

## 3. Breadcrumbs dans le parcours client

### Objectif
L'utilisateur voit ou il se trouve dans la hierarchie et peut remonter facilement.

### Etat actuel
- Le composant `src/components/ui/breadcrumb.tsx` existe (shadcn/ui) mais n'est utilise **nulle part**
- Les pages utilisent un bouton "Retour" avec ArrowLeft
- Hierarchie client : Dashboard > Projet > Livrable
- Hierarchie admin : Projets > Projet > Livrable

### Pages a modifier

**Client — projet detail** (`src/app/(dashboard)/projects/[id]/page.tsx`)
Remplacer le bouton retour par :
```
Dashboard / Nom du projet
```

**Client — livrable detail** (`src/app/(dashboard)/projects/[id]/deliverables/[deliverableId]/page.tsx`)
Remplacer le bouton retour par :
```
Dashboard / Nom du projet / Titre du livrable
```

**Admin — projet detail** (`src/app/admin/projects/[id]/page.tsx`)
Remplacer le bouton retour par :
```
Projets / Nom du projet
```

**Admin — livrable detail** (`src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx`)
Remplacer le bouton retour par :
```
Projets / Nom du projet / Titre du livrable
```

### Pattern d'implementation
```tsx
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href={`/projects/${projectId}`}>{project.name}</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>{deliverable.title}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Donnees necessaires
- Les pages livrables ont deja acces au `projectId` via params
- Le nom du projet n'est pas toujours disponible cote client — il faudra le charger
  - Admin livrable : le projet est deja charge dans certains cas (pour les notifications), sinon ajouter une query
  - Client livrable : `useDeliverableData` ne retourne pas le nom du projet — ajouter au hook ou query separee

### Fichiers concernes
- [ ] `src/app/(dashboard)/projects/[id]/page.tsx`
- [ ] `src/app/(dashboard)/projects/[id]/deliverables/[deliverableId]/page.tsx`
- [ ] `src/app/admin/projects/[id]/page.tsx`
- [ ] `src/app/admin/projects/[id]/deliverables/[deliverableId]/page.tsx`
- [ ] `src/hooks/use-deliverable-data.ts` (ajouter projectName dans le return)

---

## 4. prefers-reduced-motion

### Objectif
Respecter le choix OS de l'utilisateur qui demande moins d'animations.

### Etat actuel
- **Aucun support** `prefers-reduced-motion` dans le projet
- Sources d'animation :
  - `tw-animate-css` (import dans globals.css) — animations dialog/sheet/accordion
  - `animate-spin` (18 occurrences — spinners)
  - `animate-pulse` (4 occurrences — skeletons, upload zone)
  - Transitions CSS (50+ occurrences — hover, progress bars, sidebar)
  - `scroll-behavior: smooth` dans globals.css

### Implementation

**Ajouter dans `src/app/globals.css` :**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Cette approche globale est la plus simple et couvre :
- Toutes les animations `tw-animate-css` (dialog, sheet, accordion)
- `animate-spin`, `animate-pulse`
- Toutes les transitions CSS (hover, sidebar, progress)
- Le smooth scroll

### Alternative granulaire
Si on veut garder certaines transitions courtes (ex: couleurs de hover) :
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
  /* Garder les transitions de couleur mais reduire la duree */
  :not(.transition-colors) {
    transition-duration: 0.01ms !important;
  }
}
```

### Fichiers concernes
- [ ] `src/app/globals.css`

---

## 5. Touch targets 44px minimum

### Objectif
Tous les boutons interactifs font au moins 44x44px sur mobile (WCAG 2.5.5).

### Etat actuel des tailles button.tsx
| Variant | Taille | Ecart |
|---------|--------|-------|
| `icon-xs` | 24x24px | -20px |
| `icon-sm` | 32x32px | -12px |
| `icon` | 36x36px | -8px |
| `icon-lg` | 40x40px | -4px |
| `xs` | h-24px | -20px |
| `sm` | h-32px | -12px |
| `default` | h-36px | -8px |
| `lg` | h-40px | -4px |

### Approche
Plutot que de changer toutes les tailles visuelles (ce qui casserait le design), ajouter un **padding de zone tactile invisible** sur mobile via un pseudo-element.

**Modifier `src/components/ui/button.tsx` :**
Ajouter une classe utilitaire `touch-target` qui etend la zone cliquable sans changer le visuel :

```css
/* globals.css */
@media (pointer: coarse) {
  .touch-target {
    position: relative;
  }
  .touch-target::after {
    content: "";
    position: absolute;
    inset: -4px; /* ajuster selon la taille */
    min-width: 44px;
    min-height: 44px;
  }
}
```

Puis appliquer `touch-target` aux variants `icon`, `icon-sm`, `icon-xs` dans button.tsx.

### Alternative plus simple
Utiliser `min-h-11 min-w-11` (44px) sur les variants icon en mobile :
```
icon: "size-9 md:size-9",  // visuel inchange
```
Et ajouter un wrapper invisible.

### Fichiers concernes
- [ ] `src/app/globals.css` (classe `.touch-target`)
- [ ] `src/components/ui/button.tsx` (ajouter la classe aux variants icon)

---

## 6. Empty states plus engageants

### Objectif
Les etats vides communiquent clairement quoi faire, au lieu d'un simple "Aucun X".

### Etats vides actuels (14 a ameliorer)

**Sections dans des pages (petits empty states) :**
| Fichier | Texte actuel | Icone suggeree |
|---------|-------------|----------------|
| `comments-section.tsx` | "Aucun commentaire" | `MessageSquare` |
| `contacts-section.tsx` | "Aucun contact" | `Users` |
| `notification-bell.tsx` | "Aucune notification" | `BellOff` |
| `file-list.tsx` | "Aucun fichier pour ce livrable" | `FileX` |
| `links-section.tsx` | "Aucun lien pour ce livrable" | `Link2Off` |

**Widgets dashboard admin :**
| Fichier | Texte actuel | Icone suggeree |
|---------|-------------|----------------|
| `active-projects-table.tsx` | "Aucun projet actif" | `FolderKanban` |
| `followup-table.tsx` | "Aucun client a relancer" | `CheckCircle2` |
| `pipeline-chart.tsx` | "Aucune donnee" | `BarChart3` |
| `projects-chart.tsx` | "Aucun projet" | `FolderKanban` |
| `activity-chart.tsx` | "Aucune activite recente" | `Activity` |

**Pages admin :**
| Fichier | Texte actuel | Amelioration |
|---------|-------------|-------------|
| `admin/logs/page.tsx` | "Aucune activite trouvee" | Ajouter icone `Search` |
| `admin/projects/[id]/page.tsx` | "Aucun client assigne" | Ajouter icone `UserX` |
| `admin/projects/[id]/page.tsx` | "Aucune etape" | Deja un bouton CTA, ajouter icone |

### Pattern pour les sections
```tsx
<div className="text-center py-6">
  <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
  <p className="text-sm text-muted-foreground">Aucun commentaire</p>
</div>
```

### Pattern pour les widgets dashboard
```tsx
<div className="text-center py-8">
  <FolderKanban className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
  <p className="text-sm text-muted-foreground">Aucun projet actif</p>
</div>
```

### Fichiers concernes
- [ ] `src/components/comments-section.tsx`
- [ ] `src/components/contacts-section.tsx`
- [ ] `src/components/notification-bell.tsx`
- [ ] `src/components/file-list.tsx`
- [ ] `src/components/links-section.tsx`
- [ ] `src/components/dashboard/active-projects-table.tsx`
- [ ] `src/components/dashboard/followup-table.tsx`
- [ ] `src/components/dashboard/pipeline-chart.tsx`
- [ ] `src/components/dashboard/projects-chart.tsx`
- [ ] `src/components/dashboard/activity-chart.tsx`
- [ ] `src/app/admin/logs/page.tsx`
- [ ] `src/app/admin/projects/[id]/page.tsx`

---

## 7. Styles d'impression

### Objectif
Les pages cles sont imprimables proprement (client detail, projet detail, livrable detail).

### Etat actuel
Aucun `@media print` dans le projet.

### Implementation

**Ajouter dans `src/app/globals.css` :**

```css
@media print {
  /* Masquer les elements interactifs */
  [data-slot="sidebar"],
  [data-slot="mobile-header"],
  .toaster,
  button:not([data-print]),
  [role="dialog"],
  input,
  textarea,
  select {
    display: none !important;
  }

  /* Afficher les liens en clair */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
  a[href^="#"]::after,
  a[href^="javascript"]::after {
    content: none;
  }

  /* Eviter les coupures dans les cartes */
  [data-slot="card"] {
    break-inside: avoid;
  }

  /* Pleine largeur */
  body, main {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Badges lisibles en N&B */
  [class*="badge"] {
    border: 1px solid #999 !important;
    color: #000 !important;
    background: #fff !important;
  }
}
```

### Fichiers concernes
- [ ] `src/app/globals.css`

---

## Ordre d'implementation

1. **aria-labels** — repetitif mais rapide, gros impact accessibilite
2. **Skip to content** — 3 fichiers, 5 minutes
3. **prefers-reduced-motion** — 1 fichier CSS
4. **Touch targets** — 2 fichiers (CSS + button.tsx)
5. **Empty states** — repetitif, ~12 fichiers
6. **Breadcrumbs** — 4 pages + hook, necessite donnees projet
7. **Print styles** — 1 fichier CSS, a tester manuellement

Les chantiers 1-4 sont independants et peuvent etre faits en parallele.

---

## Verification

- [x] `npm test` passe — 356 tests
- [x] `npm run build` passe — 0 errors
- [x] 0 erreurs lint
- [ ] Tester skip link : Tab au chargement, verifier le focus saute au contenu
- [ ] Tester aria-labels : ouvrir DevTools > Accessibility, verifier chaque bouton
- [ ] Tester reduced-motion : activer "Reduce motion" dans OS, verifier aucune animation
- [ ] Tester touch targets : simuler mobile dans DevTools, verifier les zones cliquables
- [ ] Tester empty states : vider les donnees, verifier les icones
- [ ] Tester breadcrumbs : naviguer dashboard > projet > livrable, verifier le fil
- [ ] Tester impression : Ctrl+P sur une page projet, verifier le rendu
