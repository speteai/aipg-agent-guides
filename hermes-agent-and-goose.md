# AI Power Grid with Hermes Agent and Goose

Community notes, not an official AIPG document. Tested on 2026-11-15 on Linux x64 against the live grid
(`https://api.aipowergrid.io/v1`) with Hermes Agent v0.23.1 and Goose v1.59.1. `gpt-oss-120b` was tested
again on 2026-11-16, after a fix on the grid.

Both agents talk to the grid as an ordinary OpenAI-compatible endpoint. No plugin is needed: an address,
a Grid API key and a model name are enough.

## Which model

Both text models did the test task. `qwen38-flash-next-nvfp4` is the one most of these notes were written
with. Which models are online changes during the day; `GET /v1/models` shows the current list.

| Model | Hermes Agent | Goose |
| --- | --- | --- |
| `qwen38-flash-next-nvfp4` | works: wrote a script, ran it, wrote the result to a file (37 s, 6 model calls, about 80,000 tokens) | works: same task in 23 s |
| `gpt-oss-120b` | works since 2026-11-16: same task in 28 s (one run) | works since 2026-11-16: same task in 17 s (one run) |

The test task both times: "There is a file items.csv here. Write a Python script total.py that reads it
and prints the total value (qty times price summed). Run it, and write the printed number into
report.txt. Tell me the number."

Until 2026-11-16 `gpt-oss-120b` failed here: on this multi-step task the grid returned its tool call
inside the reasoning text instead of as a tool call, so the agents saw an empty reply
([aipg-documentation#70](https://github.com/AIPowerGrid/aipg-documentation/issues/70)). The AIPG team
changed the worker that evening, and the runs in the table are from after that change. OpenClaw was not
run again with this model.

At the list price of that day (0.075 USD per million input tokens, 0.30 USD per million output tokens) the
Hermes run cost about 0.6 US cents.

## Goose

Goose reads its provider from environment variables:

```bash
export GOOSE_PROVIDER=openai
export OPENAI_HOST=https://api.aipowergrid.io
export OPENAI_API_KEY=grid_...            # your Grid API key
export GOOSE_MODEL=qwen38-flash-next-nvfp4

goose run --with-builtin developer -t "List the files here and say what each one is."
```

`OPENAI_HOST` is the address without `/v1`; Goose adds the path itself. The same values can be entered
with `goose configure` (provider "OpenAI", then the host).

### As a named provider

Instead of the `OPENAI_*` variables, Goose can list the grid as its own provider. Download
[`goose/aipg.json`](goose/aipg.json) into Goose's `custom_providers` folder:

- macOS/Linux: `~/.config/goose/custom_providers/`
- Windows: `%APPDATA%\Block\goose\config\custom_providers\`

```bash
mkdir -p ~/.config/goose/custom_providers
curl -fsSL https://raw.githubusercontent.com/speteai/aipg-agent-guides/main/goose/aipg.json \
  -o ~/.config/goose/custom_providers/aipg.json

export AIPG_API_KEY=grid_...              # your Grid API key
export GOOSE_PROVIDER=aipg GOOSE_MODEL=qwen38-flash-next-nvfp4
goose run --with-builtin developer -t "List the files here and say what each one is."
```

The file contains no key. It lists only `qwen38-flash-next-nvfp4`, with the grid's list price; that is the
model the file was tested with. Tested with Goose v1.59.1 on Linux: the test task
above ran in 14 s through this provider. The Goose desktop app was not tested.

## Hermes Agent

In `~/.hermes/config.yaml`:

```yaml
model:
  default: "qwen38-flash-next-nvfp4"
  provider: "custom"
  base_url: "https://api.aipowergrid.io/v1"
  api_key: ${AIPG_API_KEY}
```

and the key in the environment (or in `~/.hermes/.env`):

```bash
export AIPG_API_KEY=grid_...              # your Grid API key
hermes -z "List the files here and say what each one is."
```

Here the address includes `/v1`. `hermes -z` runs one prompt and prints only the answer; plain `hermes`
opens the interactive session with the same settings.

Hermes reported the cost of the run as unknown: it has no price list for a custom endpoint. The grid's
prices are at `https://api.aipowergrid.io/v1/pricing`, and the account balance shows the real charge.

### As a named provider

There is also a small plugin that adds the grid as the provider `aipg`:
[hermes-aipg-provider](https://github.com/speteai/hermes-aipg-provider).

```bash
hermes plugins install speteai/hermes-aipg-provider
hermes plugins enable aipg-community
```

Then put `AIPG_API_KEY=...` into `~/.hermes/.env` and set `provider: "aipg"` in the `model` block (no
`base_url` or `api_key` line needed). Tested with Hermes Agent v0.23.1 on Linux.

## Things to know

- Prompts are processed in plain text on computers run by independent operators. Do not point an agent
  at confidential files without thinking about that.
- An agent sends its whole instruction set with every model call, so one small task used about 80,000
  input tokens in Hermes. That is cheap at grid prices, but it is not nothing.
- Not tested here: Windows and macOS, long sessions, image tools, and the agents' own web search with a
  grid model.
