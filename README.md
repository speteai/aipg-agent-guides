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
| OpenClaw | 2026.11.3 | works | works since 2026-11-16 | [openclaw-aipg-provider](https://github.com/speteai/openclaw-aipg-provider) (plugin) |
| elizaOS (runtime and OpenAI plugin) | 2.0.5 | works | works | [elizaos.md](elizaos.md) |
| PicoClaw | v0.3.1 | works (3 of 3) | 2 of 3 runs | [picoclaw-zeroclaw-nanobot.md](picoclaw-zeroclaw-nanobot.md) |
| ZeroClaw | v0.9.0 | works (3 of 3) | 0 of 3 runs | [picoclaw-zeroclaw-nanobot.md](picoclaw-zeroclaw-nanobot.md) |
| nanobot | v0.4.1 | works (3 of 3) | 1 of 3 runs | [picoclaw-zeroclaw-nanobot.md](picoclaw-zeroclaw-nanobot.md) |

elizaOS was tested on 2026-11-17 at the level of single model calls, not as a whole agent; see its guide.
Tested on 2026-11-15 on Linux x64 against the live grid; `gpt-oss-120b` again on 2026-11-16 in Goose,
Hermes Agent, the Continue CLI and OpenClaw.

## For agents: set yourself up

An agent with an EVM wallet can open its own grid account and API key without a human step. Give it this
line:

> Read https://raw.githubusercontent.com/speteai/aipg-agent-guides/main/agents/skill.md and follow the instructions to use AI Power Grid.

The file is [agents/skill.md](agents/skill.md); the helper script it uses is
[agents/aipg-join.mjs](agents/aipg-join.mjs).

## Quick settings

| Setting | Value |
| --- | --- |
| Base URL | `https://api.aipowergrid.io/v1` (Goose: `https://api.aipowergrid.io`, without `/v1`) |
| API key | your Grid API key (`grid_...`) |
| Model for agents | `qwen38-flash-next-nvfp4`. `gpt-oss-120b` skips steps in some runs, see below. `GET /v1/models` shows which are online |
| Prices | `https://api.aipowergrid.io/v1/pricing` |

For Goose there is also a ready provider file, [`goose/aipg.json`](goose/aipg.json), that adds the grid as a
named provider; see the Goose guide.
For Hermes Agent there is a provider plugin, [hermes-aipg-provider](https://github.com/speteai/hermes-aipg-provider).

## `gpt-oss-120b` skips the last step in some runs (2026-11-17)

In PicoClaw, ZeroClaw and nanobot `gpt-oss-120b` finished the four-step test task in 3 of 9 runs;
`qwen38-flash-next-nvfp4` finished it in 9 of 9. In the failed runs the model did the first steps, then
answered that it had written the result file without calling the tool.

The same shows without any agent program. With the conversation replayed up to the last step (three tool
results in the history, three tools offered, non-streaming), `POST /v1/chat/completions` returned:

| Model | Tool call returned | Text saying the file was written, no tool call |
| --- | --- | --- |
| `gpt-oss-120b` | 14 of 20 | 6 of 20 |
| `qwen38-flash-next-nvfp4` | 20 of 20 | 0 of 20 |

At the earlier steps `gpt-oss-120b` returned the tool call in 11 of 11 answered requests. Whether the
model or the grid drops the last call cannot be told from outside. The single runs marked "works since
2026-11-16" in the table above each got through; with this rate, longer tasks will not always.

## `gpt-oss-120b` and tool calls: fixed on 2026-11-16

Until then, on multi-step tasks the grid returned this model's tool call inside the reasoning text instead
of as a tool call, so agent programs saw an empty reply
([aipg-documentation#70](https://github.com/AIPowerGrid/aipg-documentation/issues/70)). The AIPG team changed
the worker on the evening of 2026-11-16. After that the test task ran through in Goose, Hermes Agent and
the Continue CLI (one run each) and in OpenClaw (3 of 3 runs).

## Privacy

Prompts are processed in plain text on computers run by independent operators. Think about that before
pointing an agent at confidential files or code.

## Related

- [aipg-frontends](https://github.com/speteai/aipg-frontends): configs for LibreChat and Open WebUI
- [SillyTavern-AIPG](https://github.com/speteai/SillyTavern-AIPG): SillyTavern extension and chat setup
- [aipg-desktop](https://github.com/speteai/aipg-desktop): desktop app for the grid

Corrections are welcome as issues or pull requests.
