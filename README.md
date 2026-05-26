# MediAI

MediAI est une plateforme web full stack de gestion clinique intelligente. Le projet couvre la gestion des patients, rendez-vous, consultations, prescriptions, suivi medicamenteux, analyse IA, authentification JWT, roles utilisateurs, audit et execution Docker.

## Stack

- Frontend : React, Vite, CSS natif, lucide-react
- Backend : Node.js, Express, JWT, Zod, PostgreSQL, Redis
- Donnees : migrations SQL PostgreSQL
- DevOps : Docker Compose, GitHub Actions

## Demarrage rapide avec Docker

```bash
cd MediAI
npm run dev
```

Puis ouvrir :

- Frontend : http://localhost:8090
- API : http://localhost:4001/health

Comptes de demonstration :

- `admin@mediai.local` / `Password123!`
- `doctor@mediai.local` / `Password123!`
- `nurse@mediai.local` / `Password123!`

## Demarrage manuel

```bash
cd MediAI
copy .env.example .env
npm run install:all
npm run db:migrate
npm run db:seed
npm run dev:app
```

Ce mode suppose que PostgreSQL et Redis sont deja disponibles en local.

- Frontend dev : http://localhost:5173
- API dev : http://localhost:4000/health

## Structure

```text
MediAI/
  backend/                 API Express
  frontend/                Application React
  docs/                    Documentation projet
  docker-compose.yml       PostgreSQL, Redis, API, frontend
  .github/workflows/ci.yml Pipeline CI
```

Le document principal est disponible dans `docs/PROJET_2_MEDIAI_EXPLICATION.md`.
