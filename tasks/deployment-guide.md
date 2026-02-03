# Horde Portal - Deployment Guide

## Prerequisites

- Vercel account with project created
- Supabase project set up
- GitHub repository connected to Vercel
- Required secrets configured in GitHub

## GitHub Secrets Configuration

Add these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (from Account Settings > Tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Production URL (https://portal.hordeagence.com) |

To find Vercel IDs:
```bash
vercel link  # Links project and shows IDs
# Or check .vercel/project.json after linking
```

## Vercel Environment Variables

Configure in Vercel Dashboard (Project Settings > Environment Variables):

### Required Variables

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Production | `https://portal.hordeagence.com` |
| `NEXT_PUBLIC_APP_URL` | Preview | `https://preview.portal.hordeagence.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase service role key (server-only) |

### Optional Variables

| Variable | Environment | Description |
|----------|-------------|-------------|
| `RESEND_API_KEY` | All | Resend API key for emails |
| `ADMIN_EMAIL` | All | Email for critical error notifications |
| `ALLOWED_ORIGINS` | Production | Comma-separated allowed CORS origins |
| `DISABLE_ERROR_EMAILS` | Preview | Set to `true` to disable error emails |

## Deployment Workflow

### Automatic Deployment (Recommended)

1. **Push to `main` branch** triggers:
   - Lint and test
   - Build
   - Deploy to production
   - Smoke tests

2. **Pull requests** trigger:
   - Lint and test
   - Build
   - Deploy to preview environment
   - Comment with preview URL

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Supabase migrations applied
- [ ] Database RLS policies reviewed
- [ ] No sensitive data in code or `.env.example`
- [ ] Security headers verified

## Rollback Procedure

### Via Vercel Dashboard

1. Go to Vercel Dashboard > Deployments
2. Find the last working deployment
3. Click "..." > "Promote to Production"

### Via CLI

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel alias <deployment-url> portal.hordeagence.com
```

## Health Check

After deployment, verify:

```bash
# Check health endpoint
curl https://portal.hordeagence.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "0.1.0",
#   "timestamp": "...",
#   "checks": { "database": "ok", "auth": "ok" }
# }
```

## Monitoring

### Logs

- Vercel Dashboard > Functions > View logs
- Filter by function name or time range

### Errors

Critical errors are sent to `ADMIN_EMAIL` with:
- Error message and stack trace
- Request ID for tracing
- Timestamp and URL

### Rate Limiting

Monitor rate limit hits via logs:
```json
{"level":"warn","message":"Rate limit exceeded","ip":"...","pathname":"/api/..."}
```

## Troubleshooting

### Build Fails

1. Check Vercel build logs
2. Verify environment variables are set
3. Run `npm run build` locally with same env vars

### Database Connection Issues

1. Check Supabase project status
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Check if IP is whitelisted (if applicable)

### CORS Errors

1. Verify `ALLOWED_ORIGINS` includes your domain
2. Check browser Network tab for actual origin
3. Ensure API route returns CORS headers

### Rate Limit Issues

If legitimate traffic is being blocked:
1. Check IP address in logs
2. Temporarily increase limits in `src/lib/security/rate-limiter.ts`
3. Consider implementing IP whitelist for known services

## Security Reminders

- Never commit `.env` files
- Rotate API keys periodically
- Review Supabase RLS policies quarterly
- Monitor for unusual traffic patterns
- Keep dependencies updated
