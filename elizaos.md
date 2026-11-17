# AI Power Grid with elizaOS

Community-written and unofficial; not an AIPG document.

elizaOS needs no extra plugin for the grid. Its own model plugin, `@elizaos/plugin-openai`, accepts any
OpenAI-compatible address.

## Settings

```env
OPENAI_API_KEY=grid_...
OPENAI_BASE_URL=https://api.aipowergrid.io/v1
OPENAI_SMALL_MODEL=gpt-oss-120b
OPENAI_LARGE_MODEL=qwen38-flash-next-nvfp4
```

Leave `ELIZA_PROVIDER` unset. Both models can take either role; `GET /v1/models` shows which are online,
because that depends on the operators' workers and changes during the day.

## Embeddings need a second source

The grid has no embeddings endpoint (`POST /v1/embeddings` returns HTTP 404), and the plugin sends
embedding requests to the same address by default. An agent that uses memory or document search needs
one of these:

- another provider for embeddings only, set with `OPENAI_EMBEDDING_URL`, `OPENAI_EMBEDDING_API_KEY` and
  `OPENAI_EMBEDDING_MODEL`;
- elizaOS's local inference plugin, which runs an embedding model on the device.

Neither was tested here.

## What was tested

On 2026-11-17, `@elizaos/core` 2.0.5 and `@elizaos/plugin-openai` 2.0.5 from npm, on Bun 1.4.2, Linux
x64, against the live grid. The plugin was registered in an `AgentRuntime` and called through
`runtime.useModel`, once with each model in each role.

| Call | `qwen38-flash-next-nvfp4` | `gpt-oss-120b` |
| --- | --- | --- |
| `TEXT_SMALL`, `TEXT_LARGE` | works | works |
| Text with a tool definition | returns the tool call | returns the tool call |
| Streaming | works | works |
| `TEXT_EMBEDDING` | HTTP 404, see above | HTTP 404, see above |

Answers came back in 1 to 2 seconds.

One thing to know: `qwen38-flash-next-nvfp4` starts its answers with two line breaks. Trim the text if
you compare it or show it as is.

## What was not tested

- A whole elizaOS agent with a character, a database and a message loop. The test used the runtime
  with storage switched off.
- The planner and response-handler roles of the plugin (`ACTION_PLANNER`, `RESPONSE_HANDLER`).
- Multi-step tasks. For those see the notes on the other programs in this repository.
- Images and audio through this plugin.

## Limits of the grid to plan for

- Context is 40,000 tokens.
- Prompts are processed in plain text on computers run by independent operators.
- More than 30 requests a minute are refused (HTTP 429).

## An agent with its own wallet

An elizaOS agent that holds a Base wallet can open its grid account and create the API key above by
itself: see [agents/skill.md](agents/skill.md) and the official page
https://aipowergrid.io/docs/agent-wallet-accounts.
