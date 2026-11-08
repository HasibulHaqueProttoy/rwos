# 0004: Hosting and environments

Date: 2026-11-08 · Status: accepted · Replaces the "hosting decided at deploy" position in 0001 and the product spec

## Decisions

- **Build, test and preview locally and on GitHub.** Local development runs on Docker (`docker-compose.yml`); every pull request runs the CI checks on GitHub Actions against a fresh database. There is **no separate staging server**.
- **Production is a Hostinger VPS** running Docker Compose: web, admin and worker containers behind Caddy with automatic TLS, PostgreSQL 16 and Redis in Docker.
- **Release rehearsal instead of staging:** before each production deploy, the exact production Docker images are built and run locally against generated data (task 1.13). This catches build and configuration problems a dev server would hide.
- **Files stay off the VPS disk:** documents and KYC files go to S3-compatible object storage (Cloudflare R2 or AWS S3) through the `FileStorage` interface; database backups are shipped off the server.
- **Stay portable anyway:** code uses only standard Node.js, PostgreSQL and Docker. No Vercel- or Supabase-only features, so moving host later needs no code changes.

## Consequences

- The team owns the server: operating system updates, firewall, SSH-key-only access, intrusion blocking, disk encryption, certificate renewal, monitoring, and recovery if the server fails. These become SOC 2 evidence the team produces itself.
- Backups need WAL archiving and nightly dumps to off-server storage, and a monthly restore test recorded in `RUNBOOK.md`.
- Without staging, a bad deploy reaches customers directly, so: CI must pass, the release rehearsal must pass, and deploys must be easy to roll back (previous image tags kept on the server).
- Background jobs use BullMQ and Redis in production too; the `JobQueue` interface stays so this can change later.

## Still open

- Server location (data centre region). It affects UK and EU data transfer rules and whether Bangladesh's rules on restricted personal data (passport and NID scans) need a local copy.
- Object storage provider and region for files and backups.

## Revisit when

Real customer data is about to arrive (customer migration in Milestone 5): reconsider a small staging stack on the VPS, separate from production, if release rehearsals are not catching enough.
