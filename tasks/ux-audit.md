# Audit UX — Horde Portal

Date: 2026-02-06

---

## 1. Problemes critiques (impact fort)

### 1.1 Aucun feedback de validation au niveau des champs
- Tous les formulaires (ClientForm, CreateClientDialog, InviteClientDialog, ContactForm, SendMessageDialog) affichent les erreurs uniquement via toast
- L'utilisateur ne sait pas quel champ pose probleme
- Pas d'indicateur de champs obligatoires (asterisque *)
- Pas de focus automatique sur le premier champ en erreur
- `aria-invalid` existe dans le design system mais n'est jamais utilise par les forms

### 1.2 Commentaires non synchronises en temps reel
- CommentsSection charge les commentaires une seule fois au mount
- Pas de Supabase channel subscription (contrairement aux notifications)
- Si client et admin sont sur le meme livrable, aucun ne voit les nouveaux commentaires
- Incoherence avec le systeme de notifications qui est temps reel

### 1.3 Pas de progression pour l'upload de fichiers
- FileUploadZone affiche un etat binaire (uploading / not uploading)
- Aucune barre de progression
- Pour un fichier de 30MB+, l'utilisateur ne sait pas si c'est bloque ou en cours
- Pas de limite de taille affichee a l'utilisateur (50MB max en backend)

### 1.4 confirm() natif pour suppression de contacts
- ContactsSection utilise window.confirm() au lieu d'AlertDialog
- Visuellement incoherent avec le reste de l'app
- Style navigateur, pas de dark mode, pas de branding

---

## 2. Problemes importants (friction quotidienne)

### 2.1 Navigation client limitee
- Pas de breadcrumb dans le parcours client (dashboard > projet > livrable)
- Pas de vue "tous mes livrables en attente de validation" — le client doit fouiller projet par projet
- Pas de widget "taches en attente" sur le dashboard client

### 2.2 Tables admin sans tri ni pagination
- FollowupTable et ActiveProjectsTable du dashboard admin: ni tri, ni pagination, ni filtre
- Si 200+ clients a relancer, liste non paginee
- La page logs a une pagination, mais pas les tables du dashboard

### 2.3 Tooltip a 0ms de delai
- TooltipProvider configure avec delayDuration={0}
- Chaque survol declenche instantanement un tooltip
- Bruyant dans les listes denses (clients, fichiers, actions)

### 2.4 Perte de donnees dans les formulaires
- SendMessageDialog: fermeture accidentelle = brouillon perdu
- CreateClientDialog: long formulaire perdu en un clic
- Pas de confirmation avant fermeture si contenu modifie

### 2.5 Pas de mises a jour optimistes
- Toutes les actions (commentaire, statut, validation) bloquent l'UI pendant la requete
- L'UI pourrait reagir instantanement et reverter en cas d'erreur

---

## 3. Ameliorations UX recommandees

### 3.1 Empty states plus engageants
- Etats vides minimalistes ("Aucun projet", "Aucun client")
- Illustrations + phrase d'onboarding rendraient l'app plus accueillante
- Important pour un nouveau client sur un dashboard vide

### 3.2 Vue "Taches en attente" pour le client
- Widget sur le dashboard: "Vous avez 3 livrables a valider"
- Raccourci direct vers les livrables pending_review
- Evite la navigation projet par projet

### 3.3 Raccourcis clavier etendus
- Prev/next clients fonctionne deja (admin/clients/[id])
- Etendre aux projets et livrables
- Ajouter des raccourcis pour les actions frequentes

### 3.4 Undo sur les actions destructives
- Supprimer client/projet/fichier est irreversible apres confirmation
- Pattern "undo" via toast (comme Gmail) serait plus indulgent

### 3.5 Sauvegarde automatique des brouillons
- Sauvegarder dans localStorage les formulaires en cours
- Restaurer si l'utilisateur revient

---

## 4. Accessibilite

| Probleme | Impact |
|----------|--------|
| Pas de "skip to content" link | Utilisateurs clavier doivent tab a travers toute la sidebar |
| prefers-reduced-motion non respecte | Animations jouent meme si l'OS demande de les reduire |
| Certains boutons icone sans aria-label | Lecteurs d'ecran ne peuvent pas les identifier |
| Indicateurs de statut par couleur uniquement | Daltoniens ne distinguent pas les statuts sans texte |
| Touch targets < 44px sur mobile | Boutons etoile priorite, actions dropdown trop petits |
| Pas de prefers-contrast support | Pas de mode haut contraste |

---

## 5. Responsive / Design

| Aspect | Constat |
|--------|---------|
| Mobile | Bien gere (cards, header mobile, sidebar en sheet) |
| Tablette | Sous-exploite — pas de breakpoint lg specifique |
| XL+ (ecran large) | Contenu ne profite pas de l'espace (max-w-4xl partout) |
| Dark mode | Complet et bien implemente |
| Print | Aucun style d'impression |

---

## 6. Composants — problemes specifiques

### Forms
- Pas d'erreurs inline (seulement toast)
- Pas d'asterisque sur champs requis
- Pas de validation async (doublon email avant submit)

### FileUploadZone
- Pas de type de fichier affiche
- Pas de limite de taille affichee
- Pas de progression

### ImagePreview
- Pas d'etat d'erreur si l'image ne charge pas (reste en skeleton)
- Pas d'image fallback

### CommentsSection
- Pas d'edit/delete sur les commentaires
- Pas de pagination (charge tout)
- Pas de temps reel

### SendMessageDialog
- Pas d'apercu du template avant envoi
- Pas de brouillon sauvegarde
- Variables template faciles a rater

### ValidationCard
- Commentaire de revision optionnel — pas clair que c'est utile
- Couleur jaune trop douce pour "action requise"

---

## Plan d'amelioration

### Phase 1 — Quick wins & fondations (priorite haute)
1. Validation inline des formulaires (erreurs sous chaque champ)
2. Vue "livrables a valider" sur le dashboard client
3. Remplacer confirm() par AlertDialog dans ContactsSection
4. Indicateurs de champs requis (asterisque)
5. Tooltip delay a 200ms

### Phase 2 — Temps reel & feedback (priorite moyenne)
1. Commentaires en temps reel (Supabase channel)
2. Barre de progression upload
3. Confirmation avant fermeture dialog avec contenu
4. Mises a jour optimistes

### Phase 3 — Polish & accessibilite (priorite basse)
1. Skip to content link
2. prefers-reduced-motion support
3. aria-labels sur tous les boutons icone
4. Touch targets 44px minimum
5. Empty states avec illustrations
6. Breadcrumbs dans le parcours client
7. Styles d'impression
