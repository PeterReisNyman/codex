# Codex Agent Objective and Design Intent

This document summarizes the intended objective of the Codex agent and the design goals evident from the codebase, configuration, and built‑in prompt. It captures what the agent is supposed to optimize for and how it should behave while assisting a developer in a terminal‑centric workflow.

## Mission

Help developers complete real coding and system tasks end‑to‑end from the terminal with speed, safety, and clarity. Prefer concrete, correct changes over verbose explanations; keep the user in control while minimizing friction.

## Core Objectives

- Solve tasks: Produce working changes (edits, commands, patches) that move the user’s task to completion, not just advice.
- Stay safe: Execute with least privilege, in sandboxes by default, and get explicit approval before risky or unsandboxed actions.
- Be transparent: Stream reasoning and outputs, announce tool usage with short preambles, and surface approvals/decisions clearly.
- Be reproducible: Record the exact conversation, environment context, and tool calls so work can be replayed and audited.
- Fit the repo: Make minimal, targeted changes; follow local style; update nearby docs/tests when appropriate.
- Respect constraints: Keep prompts within model limits and summarize long outputs for the model while preserving full streams to the UI.

## Operating Principles

- Concision: Communicate efficiently; avoid filler; focus on next concrete step.
- Planning: Maintain a lightweight plan via `update_plan` when a task has multiple steps or dependencies.
- Progress signals: Provide short preambles before tool calls and succinct progress updates while long operations run.
- Determinism: Avoid hidden state; send full conversation history (or previous response id) and environment context each turn.
- Robustness: Handle transient stream failures with backoff/retries; surface retry info to the UI so the user isn’t left guessing.

## Safety Model and Approvals

- Sandboxing: Run shell commands in a platform sandbox by default (Seatbelt on macOS, Linux sandbox on Linux); optionally allow workspace‑write within cwd.
- Approval policy: Gate execution using the configured policy (never, on‑request, on‑failure, unless‑trusted). Ask clearly when escalation is needed.
- Escalation: If a command cannot run in the sandbox (e.g., network or cross‑workspace writes), request approval and justification, then re‑run unsandboxed only if approved.
- Idempotence and scope: Prefer safe, idempotent commands; limit side effects to the workspace unless explicitly expanded by the user.

## Transparency and Feedback

- Streaming: Forward assistant text deltas and reasoning summary deltas; optionally stream raw reasoning when enabled.
- Tool events: Emit begin/end events for exec, patch, and MCP tool calls; include command, cwd, exit status, duration, and diffs.
- Diffs: When files change, provide a unified diff so users can review exactly what changed.
- Token accounting: Report token usage where available.

## Context and Memory

- System instructions: Always include `prompt.md` guidance about persona, style, planning, and tool usage.
- User instructions: Include configured instructions plus discovered `AGENTS.md` docs (bounded by size), wrapped in `<user_instructions>`.
- Environment: Provide a machine‑readable `<environment_context>` block describing cwd, approval/sandbox policy, network access, and shell.
- History: Record every assistant/user message, tool call, and tool output; send the full transcript (or prior response id) each turn.

## Tool Use

- Preferred edits: Use `apply_patch` to make scoped, reviewable file edits; validate patches before applying and emit patch events.
- Execution: Use the `shell` tool for commands; keep model‑facing summaries bounded while streaming full stdout/stderr to the UI.
- External tools: Call MCP tools when available; record arguments and results; keep deterministic tool ordering to improve cache hits.
- Interactive (opt‑in): Use `exec_command`/`write_stdin` for interactive sessions when enabled.

## Success Criteria

- The user receives minimal but sufficient explanation and clear next steps.
- Risky actions are reviewed and approved before execution.
- Outputs are tangible: merged patches, executed commands, diffs, or verified results.
- The transcript tells a complete, reproducible story of what happened and why.
- The session advances the task without unnecessary back‑and‑forth.

## Non‑Goals and Boundaries

- Do not run destructive or unsandboxed commands without explicit approval.
- Do not make large, speculative refactors unrelated to the user’s request.
- Do not hide context or actions; always disclose tool use and changes.
- Do not exceed model context limits; prefer summaries and diffs for long outputs.

## Examples of “Good” Behavior

- Proposes a small, reviewable patch that fixes the root cause and explains the change briefly.
- Runs a safe command in a sandbox and returns a summarized result to the model, streaming full output to the UI.
- Requests approval to install a dependency (network/unsandboxed), explaining exactly why and what will run.
- Updates an `AGENTS.md` or test alongside a code fix to keep the repo coherent.

This intent is distilled from the built‑in prompt, safety code paths, tool schemas, and the session/turn loop implemented in `codex-core`.

