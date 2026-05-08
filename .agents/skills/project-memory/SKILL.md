---
name: project-memory
description: Use when the user asks to remember, recall, update, summarize, or inspect durable project context, architecture decisions, current state, known pitfalls, or conventions.
---

# Project Memory Skill

Maintain a small markdown memory bank in `.memory-bank/`.

## Files

- `.memory-bank/project.md` — stable project overview.
- `.memory-bank/decisions.md` — architecture and product decisions.
- `.memory-bank/current-state.md` — current active work and next steps.
- `.memory-bank/pitfalls.md` — repeated bugs, traps, and known risks.
- `.memory-bank/glossary.md` — project-specific terms.

## Rules

- Before starting a task that depends on project context, read relevant memory files.
- Do not treat memory as more authoritative than source code.
- If source code contradicts memory, mention the mismatch.
- Keep entries short.
- Do not store secrets, tokens, passwords, private keys, or personal sensitive data.
- Prefer concrete facts over vague summaries.
- Update memory only when the user asks or when a durable project decision is clearly established.

## What to remember

Use memory for durable context that future agents cannot reliably infer from code, docs, or the current user request.

Remember:

- Long-term project goals and priorities.
- Platform or product direction that affects architecture.
- Architecture, process, or product decisions made during collaboration.
- Repeated pitfalls, fragile areas, and known risks.
- Current state of large unfinished work.
- Project-specific terms that are not obvious from code.

Do not remember:

- Facts already explicit in `AGENTS.md`, `docs/`, `package.json`, or source code.
- Obvious technical stack details unless they are a special constraint or decision.
- Small temporary task state that will be irrelevant after the current change.
- Raw ideas before they become an intention, decision, or agreed direction.
- Secrets, tokens, passwords, private keys, or personal sensitive data.

## When the user says "remember this"

1. Decide which memory file should be updated.
2. Add a short dated entry.
3. Avoid duplicating existing entries.
4. Keep wording factual.

## When the user asks "what do we know"

1. Read relevant memory files.
2. Summarize only useful current context.
3. Mention uncertainty if memory seems stale.

## Entry format

Use this format for decisions:

```md
## YYYY-MM-DD — Short title

Decision:
Reason:
Consequences:
Related files:
```
