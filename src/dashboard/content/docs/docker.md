---
title: "Docker Deployment"
description: "How to deploy Ixoye with Docker Compose — production (Caddy) or development."
---

Ixoye ships with Compose files for production and development. Each stack runs the bot/dashboard, PostgreSQL 17, and automated backups.

| File | Use when | Reverse proxy |
|------|----------|---------------|
| `docker-compose.prod.yml` | **Production** on your own VPS or server | **Bundled Caddy** (auto HTTPS) |
| `docker-compose.yml` | Default / simple start without the bundled proxy | None (app on `127.0.0.1:4002`) |
| `docker-compose.dev.yml` | Local development with source mounts | None (app on `${PORT:-4002}`) |

Use `-f` to pick a file. Stacks do not share volumes unless you configure them to.

## Production with Caddy (recommended)

`docker-compose.prod.yml` is general-purpose: no hardcoded domain. You set `DOMAIN` and public URLs in `.env`. See `Caddyfile`.

### 1. Configure environment

```bash
cp .env.example .env
```

Set at least:

```bash
DOMAIN=bot.example.com                 # your public hostname
DASHBOARD_URL=https://bot.example.com
NEXTAUTH_URL=https://bot.example.com
TRUSTED_ORIGINS=https://bot.example.com
OAUTH_REDIRECT_URI=https://bot.example.com/oauth/callback
POSTGRES_PASSWORD=change_me
NEXTAUTH_SECRET=                       # openssl rand -base64 32
```

Point DNS for `DOMAIN` at the server. Open ports **80** and **443**.

### 2. Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy reverse-proxies to the app and obtains Let’s Encrypt certificates for real hostnames. Postgres is not published on the host; the app is bound to `127.0.0.1:4002` behind Caddy.

### 3. Migrate and deploy commands

```bash
docker compose -f docker-compose.prod.yml exec ixoye npm run db:migrate
docker compose -f docker-compose.prod.yml exec ixoye npm run deploy
```

### 4. Updates

```bash
# Preferred (backup → pull → rebuild → rollback on failure)
npm run cli -- update

# Or manually
docker compose -f docker-compose.prod.yml exec ixoye npm run cli -- backup
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

> The CLI’s default `docker compose up` uses `docker-compose.yml`. For the prod file, pass the same `-f`, or set `COMPOSE_FILE=docker-compose.prod.yml` in your shell or `.env`.

## Default compose (`docker-compose.yml`)

Same core services without the bundled reverse proxy — useful behind an existing host proxy or for a quick local check:

```bash
docker compose up -d
```

The app listens on `127.0.0.1:4002` only. Put your own proxy in front and set `TRUST_PROXY_DEPTH=1`.

## PaaS (Coolify, etc.)

Any platform that runs Docker Compose works. Prefer **`docker-compose.prod.yml`** (or the default file if the platform terminates TLS itself). Map the platform proxy to port **4002** and set `DOMAIN` / URL variables in the platform UI.

## Development

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml logs -f ixoye-dev
docker compose -f docker-compose.dev.yml down
```

## CLI

```bash
npm run cli -- deploy    # build + up (default compose file)
npm run cli -- update    # backup, pull, rebuild, rollback on failure
npm run cli -- backup    # one-off Postgres backup
npm run cli -- restore   # interactive restore
```

## Database backups

The `ixoye-pg-backup` service dumps PostgreSQL on an interval (`BACKUP_INTERVAL_SECONDS`, default daily) and keeps `BACKUP_RETENTION_COUNT` copies under `./backups`.
