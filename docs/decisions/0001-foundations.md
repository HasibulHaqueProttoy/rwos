# 0001: Foundations

Date: 2026-11-08 · Status: accepted

## Decisions

- TypeScript monorepo (pnpm + Turborepo) with two Next.js apps (customer, admin) and a worker, sharing domain modules: a modular monolith, not microservices.
- PostgreSQL + Drizzle, Better Auth, S3-compatible storage, BullMQ jobs: chosen because they run identically on Vercel + Supabase and on a self-managed VPS. Hosting is decided at deploy time.
- Every outside service behind an interface with a test provider, so the whole system works before any real API key exists.
- Claude Code is the only AI coding tool for the build, to keep conventions consistent.
- Security target ASVS level 2 and SOC 2 readiness.

## Why

A two-person team needs one codebase, few moving parts, and the freedom to change hosting and providers without rewrites.
