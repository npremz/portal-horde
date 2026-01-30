# Horde Portal

Portail client pour Horde Agence - Suivi de projets et livraison de livrables.

## Stack technique

- **Next.js 15** (App Router, Turbopack)
- **Supabase** (Auth, PostgreSQL, Storage)
- **Tailwind CSS 4** + **shadcn/ui**
- **TypeScript**

## Setup

### 1. Creer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) et creer un nouveau projet
2. Noter l'URL du projet et les cles API (anon + service role)

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir les valeurs dans `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxx
```

### 3. Initialiser la base de donnees

Dans le SQL Editor de Supabase, executer le contenu de:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Configurer l'authentification Supabase

Dans Supabase Dashboard > Authentication > Settings:

1. **Site URL**: `http://localhost:3000` (ou votre URL de prod)
2. **Redirect URLs**: Ajouter `http://localhost:3000/auth/callback`
3. **Email Templates**: Personnaliser si souhaite (optionnel)

### 5. Creer le premier admin

Dans Supabase Dashboard > SQL Editor, executer:

```sql
-- Remplacer par votre email
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'votre@email.com',
  crypt('motdepasse', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Mettre a jour le profil en admin
UPDATE profiles
SET role = 'admin', full_name = 'Votre Nom'
WHERE email = 'votre@email.com';
```

Ou utiliser la methode magic link:
1. S'inscrire normalement via `/login`
2. Mettre a jour le role en admin via SQL

### 6. Lancer le serveur de dev

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
src/
├── app/
│   ├── (auth)/           # Pages d'auth (login, callback)
│   ├── (dashboard)/      # Dashboard client
│   │   ├── dashboard/    # Page principale
│   │   └── projects/     # Vue projet client
│   ├── admin/            # Panel admin
│   │   ├── projects/     # Gestion projets
│   │   └── clients/      # Gestion clients
│   └── api/              # API routes
├── components/
│   ├── ui/               # Composants shadcn
│   └── ...               # Composants custom
├── lib/
│   └── supabase/         # Clients Supabase
└── types/                # Types TypeScript
```

## Deploiement Vercel

1. Pusher le repo sur GitHub
2. Connecter a Vercel
3. Ajouter les variables d'environnement
4. Mettre a jour `NEXT_PUBLIC_APP_URL` avec l'URL Vercel
5. Ajouter l'URL Vercel dans les Redirect URLs de Supabase

## Fonctionnalites MVP

- [x] Auth magic link (clients invites par admin)
- [x] Dashboard client avec vue projets
- [x] Timeline des phases par projet
- [x] Admin: gestion projets et clients
- [ ] Upload de livrables (a venir)
- [ ] Commentaires sur livrables (a venir)
- [ ] Notifications email (a venir)

## Prochaines etapes

1. **Page livrable**: Vue detail avec fichiers et commentaires
2. **Upload fichiers**: Integration Supabase Storage
3. **Validation livrables**: Boutons approuver/demander revision
4. **Notifications**: Emails via Resend sur nouveaux livrables/commentaires
