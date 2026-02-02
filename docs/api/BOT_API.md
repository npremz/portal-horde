# Horde Portal Bot API

API REST optimisee pour les bots et agents CRM.

## Authentication

Toutes les requetes necessitent une cle API dans le header:

```
Authorization: Bearer horde_xxxxxxxxxxxxx
```

Les cles API sont creees depuis `/admin/api-keys`.

## Base URL

```
https://portal.hordeagence.com/api/v1
```

## Permissions

| Permission | Description |
|------------|-------------|
| `clients:read` | Lire clients et contacts |
| `clients:write` | Creer/modifier clients et contacts |
| `clients:delete` | Supprimer clients et contacts |
| `messages:send` | Envoyer messages prospection |
| `stats:read` | Acces statistiques dashboard |

## Codes de reponse

| Code | Description |
|------|-------------|
| 200 | Succes |
| 201 | Cree |
| 400 | Requete invalide |
| 401 | Cle API manquante ou invalide |
| 403 | Permission insuffisante |
| 404 | Ressource non trouvee |
| 409 | Conflit (email deja existant) |
| 500 | Erreur serveur |

---

## Clients

### Lister les clients

```
GET /clients
```

**Parametres:**
- `page` (int, default: 1)
- `per_page` (int, default: 20, max: 100)
- `status` (string): lead, contacted, in_project, pending_review, completed, archived
- `search` (string): recherche par nom ou email

**Reponse:**
```json
{
  "data": [
    {"id": "uuid", "name": "Acme", "email": "contact@acme.com", "status": "lead"}
  ],
  "meta": {"total": 42, "page": 1, "per_page": 20}
}
```

### Obtenir un client

```
GET /clients/{id}
```

**Reponse:**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+32...",
  "status": "in_project",
  "contacts": [
    {"id": "uuid", "name": "Jean", "role": "decision_maker", "email": "jean@acme.com"}
  ]
}
```

### Creer un client

```
POST /clients
```

**Corps:**
```json
{
  "name": "Nouveau Client",
  "email": "contact@client.com",
  "phone": "+32...",
  "status": "lead",
  "project_type": "site-web",
  "sector": "tech",
  "notes": "Notes internes"
}
```

**Reponse (201):**
```json
{
  "data": {"id": "uuid", "name": "Nouveau Client", "email": "contact@client.com", "status": "lead"}
}
```

### Modifier un client

```
PATCH /clients/{id}
```

**Corps (champs optionnels):**
```json
{
  "status": "contacted",
  "notes": "Premier appel effectue"
}
```

### Supprimer un client

```
DELETE /clients/{id}
```

**Reponse:**
```json
{"success": true}
```

---

## Contacts

### Lister les contacts d'un client

```
GET /clients/{id}/contacts
```

**Reponse:**
```json
{
  "data": [
    {"id": "uuid", "name": "Jean Dupont", "role": "decision_maker", "email": "jean@acme.com", "is_primary": true}
  ]
}
```

### Ajouter un contact

```
POST /clients/{id}/contacts
```

**Corps:**
```json
{
  "name": "Marie Martin",
  "email": "marie@acme.com",
  "phone": "+32...",
  "role": "technical",
  "is_primary": false,
  "notes": "Responsable IT"
}
```

**Roles disponibles:** decision_maker, technical, billing, marketing, other

### Modifier un contact

```
PATCH /contacts/{id}
```

**Corps (champs optionnels):**
```json
{
  "role": "decision_maker",
  "is_primary": true
}
```

### Supprimer un contact

```
DELETE /contacts/{id}
```

---

## Statistiques

### Obtenir les stats dashboard

```
GET /stats
```

**Reponse:**
```json
{
  "counts": {
    "clients": 42,
    "pipeline": 15,
    "projects": 8,
    "followups": 3
  },
  "clients_by_status": [
    {"status": "lead", "count": 10},
    {"status": "in_project", "count": 8}
  ],
  "projects_by_status": [
    {"status": "active", "count": 8}
  ],
  "metrics": {
    "conversion_rate": 45,
    "messages_30d": 28,
    "new_clients_30d": 5
  }
}
```

---

## Exemples curl

```bash
# Lister les leads
curl -H "Authorization: Bearer horde_xxx" \
  "https://portal.hordeagence.com/api/v1/clients?status=lead"

# Creer un client
curl -X POST -H "Authorization: Bearer horde_xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","status":"lead"}' \
  "https://portal.hordeagence.com/api/v1/clients"

# Passer un lead en "contacted"
curl -X PATCH -H "Authorization: Bearer horde_xxx" \
  -H "Content-Type: application/json" \
  -d '{"status":"contacted"}' \
  "https://portal.hordeagence.com/api/v1/clients/{id}"

# Obtenir les stats
curl -H "Authorization: Bearer horde_xxx" \
  "https://portal.hordeagence.com/api/v1/stats"
```

---

## Format des reponses

- JSON minimal pour economiser les tokens
- Champs `null` omis dans les reponses
- Pagination sur les listes avec `meta.total`
