# Start here

This repository is set up so Claude Code can build Rocket Wave OS step by step. Nothing is coded yet; the docs are the plan.

## Before the first session (once)

1. Install: Node.js 22 LTS, pnpm 9, Docker Desktop, Git, Claude Code.
2. Clone this repository and open a terminal in it.
3. Start Claude Code in the repository folder: `claude`

## The first message to send Claude Code

Copy and paste this:

```
Read CLAUDE.md and every file in docs/ in the order CLAUDE.md lists.
Then start Milestone 1 in docs/BUILD_PLAN.md with task 1.1.
Before writing any code, show me your plan for task 1.1 (files, commands, tests) and wait for my approval.
After each task: run lint, typecheck and tests, update the docs, tick the task in BUILD_PLAN.md, commit on a branch named after the task, and stop for my review.
```

## Every later session

```
Read CLAUDE.md and docs/BUILD_PLAN.md. Continue with the next unticked task. Show the plan first and wait for approval.
```

## Rules for the two of you

- One task per session and per pull request. Review every pull request before merging.
- If Claude asks a business question (a fee, a deadline, a permission), answer it and add the answer to the right doc, so it is never asked again.
- Never paste real customer data, passports or API keys into the chat or the repository.
