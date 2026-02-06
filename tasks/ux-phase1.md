# UX Phase 1 — Quick wins & fondations

Date: 2026-02-06
Ref: tasks/ux-audit.md

---

## Vue d'ensemble

5 chantiers, ordonnes par impact utilisateur:

1. Validation inline des formulaires
2. Widget "livrables a valider" sur le dashboard client
3. Remplacer confirm() par AlertDialog dans ContactsSection
4. Indicateurs de champs requis (asterisque)
5. Tooltip delay a 200ms

---

## 1. Validation inline des formulaires

### Objectif
Afficher les erreurs sous chaque champ en erreur au lieu de toast generiques.

### Fichiers a creer
- `src/components/ui/form-field-error.tsx` — Composant simple: affiche un message d'erreur en rouge sous un champ

### Pattern d'implementation
```tsx
// Nouveau state dans chaque formulaire
const [errors, setErrors] = useState<Record<string, string>>({});

// Validation au submit: collecter toutes les erreurs
const newErrors: Record<string, string> = {};
const nameResult = validateName(formData.name);
if (!nameResult.valid) newErrors.name = nameResult.error!;
// ... autres champs
if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

// Dans le JSX: aria-invalid + message
<Input aria-invalid={!!errors.name} ... />
<FormFieldError error={errors.name} />

// Effacer l'erreur quand l'utilisateur tape
onChange={(e) => {
  setFormData({...formData, name: e.target.value});
  if (errors.name) setErrors(prev => { const {name, ...rest} = prev; return rest; });
}}
```

### Formulaires a migrer (par priorite)

**Priorite 1 — Plus d'impact:**
- [ ] `src/components/crm/client-form.tsx` (12 champs)
- [ ] `src/components/crm/create-client-dialog.tsx` (12 champs)
- [ ] `src/app/admin/projects/new/page.tsx` (5 champs + phases)

**Priorite 2 — Impact moyen:**
- [ ] `src/components/crm/create-user-dialog.tsx` (4 champs)
- [ ] `src/app/(dashboard)/contact/page.tsx` (3 champs)
- [ ] `src/components/crm/send-message-dialog.tsx` (4 champs)

**Priorite 3 — Impact faible:**
- [ ] `src/app/(dashboard)/settings/page.tsx` (2 champs)
- [ ] `src/components/crm/invite-client-dialog.tsx` (3 champs)
- [ ] `src/app/admin/projects/[id]/deliverables/new/page.tsx` (3 champs)

### Ce qui ne change PAS
- `src/lib/validation.ts` — deja parfait, retourne {valid, sanitized, error}
- `src/components/ui/input.tsx` — supporte deja aria-invalid (bordure rouge)
- `src/components/ui/textarea.tsx` — idem
- `src/components/ui/select.tsx` — idem

---

## 2. Widget "livrables a valider" sur le dashboard client

### Objectif
Le client voit immediatement les livrables qui attendent son action sans naviguer projet par projet.

### Constat actuel
- La stat card "En attente de validation" existe deja mais compte les **phases** en status "review"
- Il faut compter les **deliverables** en status "pending_review" (plus actionnable)
- Pas de liste detaillee, juste un compteur

### Modifications

**Fichier:** `src/app/(dashboard)/dashboard/page.tsx`

1. **Corriger le compteur** — remplacer le comptage phases review par deliverables pending_review:
```typescript
// Actuel: compte les phases
const pendingValidations = projects.reduce((acc, p) =>
  acc + p.phases.filter(ph => ph.status === "review").length, 0);

// Nouveau: compte les deliverables
const pendingValidations = projects.reduce((acc, p) =>
  acc + p.phases.reduce((phAcc, ph) =>
    phAcc + (ph.deliverables?.filter(d => d.status === "pending_review").length || 0), 0), 0);
```

2. **Ajouter une section "A valider"** entre les stats et la liste de projets:
- Liste compacte des deliverables pending_review
- Chaque item: nom du projet > nom du livrable + date
- Lien direct vers `/projects/[projectId]/deliverables/[deliverableId]`
- Si aucun livrable en attente: ne pas afficher la section

### Donnees deja disponibles
La query existante charge deja `phases(*, deliverables(*))` donc pas de requete supplementaire.

---

## 3. Remplacer confirm() par AlertDialog

### Objectif
Coherence visuelle: utiliser AlertDialog au lieu du confirm() natif du navigateur.

### Fichier
`src/components/contacts-section.tsx`

### Modification
- Ajouter un state `contactToDelete` pour tracker quel contact supprimer
- Ajouter un `<AlertDialog>` dans le JSX avec le message de confirmation
- Le bouton "Supprimer" du AlertDialog appelle la logique existante de `handleDelete`
- Importer AlertDialog (le composant existe deja dans ui/)

### Code actuel (ligne 160):
```tsx
if (!confirm(`Supprimer le contact ${contact.name} ?`)) return;
```

### Remplacement:
```tsx
const [contactToDelete, setContactToDelete] = useState<ClientContact | null>(null);

// Bouton delete -> ouvre le dialog
onClick={() => setContactToDelete(contact)}

// AlertDialog avec onConfirm -> handleDelete(contactToDelete)
```

---

## 4. Indicateurs de champs requis

### Objectif
L'utilisateur sait quels champs sont obligatoires AVANT de soumettre.

### Approche
Ajouter ` *` apres le label des champs requis dans chaque formulaire.

### Champs concernes par formulaire:

| Formulaire | Champs requis |
|-----------|---------------|
| ClientForm | name, email |
| CreateClientDialog | name, email |
| NewProject | name, phases (min 1) |
| CreateUserDialog | email, full_name, role |
| ContactPage | category, subject, message |
| SendMessageDialog | recipient, subject, content |
| Settings | fullName |
| InviteClientDialog | email, full_name |
| NewDeliverable | phase_id, title |

### Implementation
Modifier les `<Label>` existants:
```tsx
// Avant
<Label htmlFor="name">Nom / Entreprise</Label>

// Apres
<Label htmlFor="name">Nom / Entreprise <span className="text-destructive">*</span></Label>
```

A faire en meme temps que la validation inline (chantier 1) pour chaque formulaire.

---

## 5. Tooltip delay a 200ms

### Objectif
Eviter que les tooltips apparaissent instantanement au moindre survol.

### Fichier
`src/components/ui/sidebar.tsx` (ligne 131)

### Modification
```tsx
// Avant
<TooltipProvider delayDuration={0}>

// Apres
<TooltipProvider delayDuration={200}>
```

### Verification
Verifier qu'il n'y a pas d'autre TooltipProvider dans l'app avec delayDuration={0}.

---

## Ordre d'implementation

1. **FormFieldError component** — fondation pour tout le reste
2. **Tooltip delay** — 1 ligne, impact immediat
3. **confirm() -> AlertDialog** — changement isole
4. **Validation inline + asterisques** — formulaire par formulaire (P1, P2, P3)
5. **Widget livrables a valider** — dashboard client

---

## Verification

- [ ] `npm test` passe apres chaque changement
- [ ] `npm run build` passe
- [ ] Tester manuellement: soumettre un formulaire vide, verifier les erreurs inline
- [ ] Tester le dashboard client avec 0 livrables pending (section masquee)
- [ ] Tester le dashboard client avec N livrables pending (section affichee)
- [ ] Verifier le dark mode sur tous les changements
- [ ] Verifier le mobile sur tous les changements
