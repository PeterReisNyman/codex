# AI Tools (TypeScript)

TypeScript translations of Codex AI tools: schemas and callable functions mirroring the Rust implementation (`codex-rs/core`).

Exports include tool schemas and typed function signatures for:
- `shell` (default function tool; sandbox-aware variant builder)
- `exec_command` and `write_stdin` (streamable shell pair)
- `apply_patch` (freeform custom tool and JSON function tool)
- `update_plan` (plan tool)
- `view_image` (attach local image by path)
- `web_search_preview` (schema only)

These are framework-agnostic; integrate with your agent runtime as needed.
