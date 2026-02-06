# External Tools & APIs

Knowledge docs for external tools, APIs, and libraries. Each doc contains everything you need to work with that tool: overview, current state, API operations, limits, gotchas.

**Rule: You MUST NOT write code using an external tool unless it's documented here. If you need a tool that isn't listed (or need info not covered), run the `docs-researcher` agent first.**

## When to Read These Docs

- Before writing ANY code that uses an external tool
- When planning features that involve external integrations
- When you need current info (versions, models, limits)
- When something isn't working as expected

## When to Run docs-researcher

- Tool not listed below
- Listed but missing the operations/info you need
- Need to verify current state (versions change, models get deprecated)
- Uncertain about limits, pricing tiers, or constraints

## Available Documentation

| Tool | Doc | Version |
|------|-----|---------|
| @odysseyml/odyssey | [odyssey-sdk.md](odyssey-sdk.md) | 1.0.0 |
| @google/genai (Gemini Image Gen) | [gemini-image-gen.md](gemini-image-gen.md) | 1.40.0 |

## Reference Material

| Topic | Doc | Description |
|-------|-----|-------------|
| World Model | [odyssey-2-pro-overview.md](../odyssey-2-pro-overview.md) | What Odyssey-2 Pro is — action-conditioned world model, real-time frame prediction |
| Prompting | [interaction-tips.md](../interaction-tips.md) | Prompt structure, styles, camera/framing, midstream tips, negative prompts, limitations |
| Website Docs | [odyssey/](odyssey/) | Full official SDK docs (class, hook, recordings, simulate, types, examples) |
