# AI Power Grid with coding and agent tools

Short, tested setup notes for using the [AI Power Grid](https://aipowergrid.io) with common agent and
coding programs. Community-written and unofficial; not an AIPG document.

The grid offers an OpenAI-compatible API at `https://api.aipowergrid.io/v1`. Every program below works
with an address, a Grid API key and a model name. Each guide says what was run, on which version, and
what was not tested.

| Program | Tested version | `qwen38-flash-next-nvfp4` | `gpt-oss-120b` | Guide |
| --- | --- | --- | --- | --- |
| Goose | v1.59.1 | works | works since 2026-11-16 | [hermes-agent-and-goose.md](hermes-agent-and-goose.md) |
| Hermes Agent | v0.23.1 | works | works since 2026-11-16 | [hermes-agent-and-goose.md](hermes-agent-and-goose.md) |
| Aider | 0.86.2 | works | works | [aider-and-continue.md](aider-and-continue.md) |
| Continue CLI (no longer maintained) | 1.5.47 | works | works since 2026-11-16 | [aider-and-continue.md](aider-and-continue.md) |
| OpenClaw | 2026.11.3 | works | failed on 2026-11-15, not run again | [openclaw-aipg-provider](https://github.com/speteai/openclaw-aipg-provider) (plugin) |

Tested on 2026-11-15 on Linux x64 against the live grid; `gpt-oss-120b` again on 2026-11-16 in Goose,
Hermes Agent and the Continue CLI.

## Quick settings

| Setting | Value |
| --- | --- |
| Base URL | `https://api.aipowergrid.io/v1` (Goose: `https://api.aipowergrid.io`, without `/v1`) |
| API key | your Grid API key (`grid_...`) |
| Model for agents | `qwen38-flash-next-nvfp4` or `gpt-oss-120b`; `GET /v1/models` shows which are online |
| Prices | `https://api.aipowergrid.io/v1/pricing` |

For Goose there is also a ready provider file, [`goose/aipg.json`](goose/aipg.json), that adds the grid as a
named provider; see the Goose guide.
For Hermes Agent there is a provider plugin, [hermes-aipg-provider](https://github.com/speteai/hermes-aipg-provider).

## `gpt-oss-120b` and tool calls: fixed on 2026-11-16

Until then, on multi-step tasks the grid returned this model's tool call inside the reasoning text instead
of as a tool call, so agent programs saw an empty reply
([aipg-documentation#70](https://github.com/AIPowerGrid/aipg-documentation/issues/70)). The AIPG team changed
the worker on the evening of 2026-11-16. After that the test task ran through in Goose, Hermes Agent and
the Continue CLI, one run each.

## Privacy

Prompts are processed in plain text on computers run by independent operators. Think about that before
pointing an agent at confidential files or code.

## Related

- [aipg-frontends](https://github.com/speteai/aipg-frontends): configs for LibreChat and Open WebUI
- [SillyTavern-AIPG](https://github.com/speteai/SillyTavern-AIPG): SillyTavern extension and chat setup
- [aipg-desktop](https://github.com/speteai/aipg-desktop): desktop app for the grid

Corrections are welcome as issues or pull requests.
