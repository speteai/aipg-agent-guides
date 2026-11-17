# AI Power Grid with PicoClaw, ZeroClaw and nanobot

Community-written and unofficial; not an AIPG document.

All three take the grid as an OpenAI-compatible endpoint, with settings only. Tested on 2026-11-17 on
Linux x64 against the live grid.

## Result

The test task has four steps: read `items.csv`, write `total.py`, run it, write the printed number to
`report.txt`. A run counts as passed when `report.txt` holds the right number. Three runs per cell.

| Program | Version | `qwen38-flash-next-nvfp4` | `gpt-oss-120b` |
| --- | --- | --- | --- |
| PicoClaw | v0.3.1 | 3 of 3 | 2 of 3 |
| ZeroClaw | v0.9.0 | 3 of 3 (needs `native_tools = true`) | 0 of 3 |
| nanobot | v0.4.1 | 3 of 3 | 1 of 3 |

Use `qwen38-flash-next-nvfp4`. In the failed `gpt-oss-120b` runs the model did the first three steps, then
answered that it had written `report.txt` without calling the tool. The same shows at the API itself; see
"gpt-oss-120b skips the last step" in the [README](README.md).

Runs took 12 to 32 seconds.

## PicoClaw

Add an entry to `model_list` in `~/.picoclaw/config.json` and name it as the default:

```json
{
  "agents": { "defaults": { "model_name": "aipg-qwen38" } },
  "model_list": [
    {
      "model_name": "aipg-qwen38",
      "provider": "openai",
      "model": "qwen38-flash-next-nvfp4",
      "api_base": "https://api.aipowergrid.io/v1",
      "api_keys": ["grid_..."],
      "request_timeout": 300
    }
  ]
}
```

`picoclaw agent -m "..."` then uses the grid; `--model <model_name>` picks another entry. The default
`max_tokens` of 32768 was left as it is.

## ZeroClaw

In `config.toml`:

```toml
[providers.models.custom.aipg]
uri = "https://api.aipowergrid.io/v1"
model = "qwen38-flash-next-nvfp4"
api_key = "grid_..."
native_tools = true

[agents.grid]
model_provider = "custom.aipg"
risk_profile = "open"

[risk_profiles.open]
level = "full"
workspace_only = true
```

Run with `zeroclaw agent --agent grid -m "..."`.

- **`native_tools = true` is needed.** Without it ZeroClaw sends no tool definitions and describes the
  tools in the system prompt instead. In that mode `qwen38-flash-next-nvfp4` returned empty answers
  ("The model provider returned an invalid semantic completion") and `gpt-oss-120b` answered without
  using any tool, with a wrong number.
- **The prompt is large.** A first request carried 12,000 to 17,000 input tokens with ZeroClaw's 50
  tools. The grid's context is 40,000 tokens, so long sessions run out early.
- `level = "full"` lets the agent act without asking; it was used here because the test ran without a
  terminal. Choose the risk profile you want.
- The API key was written into `config.toml` by hand. `zeroclaw config set` asks for secrets on a terminal.

## nanobot

In `~/.nanobot/config.json`:

```json
{
  "providers": {
    "custom": { "apiKey": "grid_...", "apiBase": "https://api.aipowergrid.io/v1" }
  },
  "modelPresets": {
    "primary": {
      "provider": "custom",
      "model": "qwen38-flash-next-nvfp4",
      "maxTokens": 8192,
      "contextWindowTokens": 40000
    }
  },
  "agents": { "defaults": { "modelPreset": "primary" } }
}
```

Run with `nanobot agent -m "..."`. Set `contextWindowTokens` to 40000; nanobot's default is 200000.

## Not tested

- Channels (Telegram, Discord and the others), memory, scheduled tasks, MCP servers and skills.
- Long sessions. Each run was one short task in a fresh session.
- Images through these programs.

## Limits of the grid to plan for

- Context is 40,000 tokens.
- Prompts are processed in plain text on computers run by independent operators.
- More than 30 requests a minute are refused (HTTP 429).
- Which models are online changes during the day; `GET /v1/models` shows the current list.
