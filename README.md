# AI Power Grid with coding and agent tools

Short, tested setup notes for using the [AI Power Grid](https://aipowergrid.io) with common agent and
coding programs. Community-written and unofficial; not an AIPG document.

The grid offers an OpenAI-compatible API at `https://api.aipowergrid.io/v1`. Every program below works
with an address, a Grid API key and a model name. Each guide says what was run, on which version, and
what was not tested.

| Program | Tested version | `qwen38-flash-next-nvfp4` | `gpt-oss-120b` | Guide |
| --- | --- | --- | --- | --- |
| Goose | v1.59.1 | works | fails | [hermes-agent-and-goose.md](hermes-agent-and-goose.md) |
| Hermes Agent | v0.23.1 | works | fails | [hermes-agent-and-goose.md](hermes-agent-and-goose.md) |
| Aider | 0.86.2 | works | works | [aider-and-continue.md](aider-and-continue.md) |
| Continue CLI (no longer maintained) | 1.5.47 | works | fails | [aider-and-continue.md](aider-and-continue.md) |
| OpenClaw | 2026.11.3 | works | fails | [openclaw-aipg-provider](https://github.com/speteai/openclaw-aipg-provider) (plugin) |

Tested on 2026-11-15 on Linux x64 against the live grid.

## Quick settings

| Setting | Value |
| --- | --- |
| Base URL | `https://api.aipowergrid.io/v1` (Goose: `https://api.aipowergrid.io`, without `/v1`) |
| API key | your Grid API key (`grid_...`) |
| Model for agents | `qwen38-flash-next-nvfp4` |
| Prices | `https://api.aipowergrid.io/v1/pricing` |

For Goose there is also a ready provider file, [`goose/aipg.json`](goose/aipg.json), that adds the grid as a
named provider; see the Goose guide.
For Hermes Agent there is a provider plugin, [hermes-aipg-provider](https://github.com/speteai/hermes-aipg-provider).

## Known limit: `gpt-oss-120b` and tool calls

On multi-step tasks the grid currently returns this model's tool call inside the reasoning text instead of
as a tool call, so agent programs see an empty reply. Reported as
[aipg-documentation#70](https://github.com/AIPowerGrid/aipg-documentation/issues/70). Aider is not
affected because it does not use tool calls.

## Privacy

Prompts are processed in plain text on computers run by independent operators. Think about that before
pointing an agent at confidential files or code.

## Related

- [aipg-frontends](https://github.com/speteai/aipg-frontends): configs for LibreChat and Open WebUI
- [SillyTavern-AIPG](https://github.com/speteai/SillyTavern-AIPG): SillyTavern extension and chat setup
- [aipg-desktop](https://github.com/speteai/aipg-desktop): desktop app for the grid

Corrections are welcome as issues or pull requests.
