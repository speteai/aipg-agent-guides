---
name: ai-power-grid-join
description: How an agent with an EVM wallet gets its own AI Power Grid account and API key without a human step, and uses the grid's OpenAI-compatible API for text and images.
---

# AI Power Grid for agents

AI Power Grid (AIPG) is an OpenAI-compatible API for open models, served by independent GPU operators:
`https://api.aipowergrid.io/v1`. An agent that has an EVM wallet can open its own account there by signing
one sign-in message. No browser, no e-mail, no human step.

This file is written by a community member who runs a worker on the grid and is paid in AIPG for it. It is
not an official AIPG document. The steps below were run end to end against the live grid on 2026-11-17.
The official description of the same calls is https://aipowergrid.io/docs/agent-wallet-accounts; where the
two differ, the official page is right.

## Before you start

- Do this only if you are allowed to open accounts for yourself. If you are not sure, ask your human first.
- Your wallet's private key stays on your machine. It signs one text message locally. Never send the key to
  any address, and never put it in a prompt. Do not print the key file either, not even a part of it:
  whatever a command prints reaches your model provider.
- The sign-in message is a plain "Sign-In with Ethereum" text. Signing it moves nothing and approves no
  transfer. Read it before you sign; it must start with `localhost wants you to sign in`
  (the sign-in domain the grid lists for scripts) and name chain id 8453 (Base).
- Everything here talks to one host: `api.aipowergrid.io`.
- Requests are processed in plain text on computers run by independent operators. Do not send secrets,
  credentials or personal data in prompts.

## Step 1: account and API key

### With the helper script

Needs Node.js 18 or newer.

```bash
mkdir aipg-join && cd aipg-join
npm install viem
curl -sO https://raw.githubusercontent.com/speteai/aipg-agent-guides/main/agents/aipg-join.mjs
AIPG_WALLET_KEY_FILE=/path/to/your/wallet.key node aipg-join.mjs
```

`AIPG_WALLET_KEY_FILE` is a file that holds the private key (`0x` and 64 hex characters). The script is about
100 lines; read it before you run it. It checks that the sign-in message is the expected one, signs it,
creates an API key, writes the key to
`~/.config/aipg/api.key` (readable only by you; change the place with `AIPG_KEY_FILE`) and prints a JSON
summary: `ok`, `signed_message`, `credit_usd`, `text_models_online`, `next`. It prints neither key. Running it again only
reports the account's state.

If you have no wallet, add `--create-wallet`; the script then makes one in the file you named. Keep that file:
it is the only way back into the account.

### By hand, with your own signer

1. `POST /v1/accounts/wallet/challenge` with
   `{"address":"0x...","domain":"localhost","uri":"http://localhost","chain_id":8453}`.
   The answer has `message`.
2. Sign `message` as a personal message (EIP-191), exactly as returned.
3. `POST /v1/accounts/wallet/verify` with `{"message":"...","signature":"0x...","address":"0x..."}`.
   The answer has `access_token`.
4. `POST /v1/account/keys` with header `Authorization: Bearer <access_token>` and body `{"label":"agent"}`.
   The answer has `api_key` (starts with `grid_`). It is shown once; store it in a file only you can read.

Send a `User-Agent` header of your own on every request: the API's edge refuses some default client strings
(Python's `urllib` gets HTTP 403).

## Step 2: use it

Any OpenAI-compatible client works with base URL `https://api.aipowergrid.io/v1` and the key.

```bash
KEY=$(cat ~/.config/aipg/api.key)
curl -s https://api.aipowergrid.io/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}],"max_tokens":1024}'
```

- **Which models are online** changes during the day, because they depend on the operators' workers.
  `GET /v1/models` lists them; `"model":"auto"` picks one that is online.
- **Text models on 2026-11-17:** `qwen38-flash-next-nvfp4`, `gpt-oss-120b`, `grid/qwen3:8b`. For multi-step
  work with tools use `qwen38-flash-next-nvfp4`; it was tested with OpenClaw, Hermes Agent, Goose, Aider,
  the Continue CLI, PicoClaw, ZeroClaw and nanobot. `gpt-oss-120b` returns tool calls too, but in tests on
  2026-11-17 it sometimes said a step was done without calling the tool (6 of 20 requests at the last step
  of a four-step task).
- **List price:** 0.075 USD per million input tokens, 0.30 USD per million output tokens. Images from about
  0.003 USD each (`POST /v1/images/generations`, model `z-image-turbo`). Current prices: `GET /v1/pricing`.
- **Credit left:** `GET /v1/account/credits`, field `total_spendable_usd`.

Limits to plan for:

| Limit | What to do |
| --- | --- |
| Context is 40,000 tokens | Keep the conversation short; summarise long tool output |
| The models think before they answer | Keep `max_tokens` at 1024 or more, or the answer comes back empty but billed |
| A request is cut off after 120 seconds (HTTP 524) | Use `"stream": true` for long answers |
| 30 requests per minute (HTTP 429) | Wait a minute |
| HTTP 402 | No credit left; see below |
| HTTP 404 on a model | It is offline right now; read `/v1/models` again |

## Getting credit

A new account starts with zero credit. There are two ways to get some. Both involve funds, so use them only
within what your human has allowed you to spend or hold.

**Deposit.** `GET /v1/account/deposits/config` (with your key) names the accepted assets on Base and, for
each, the `treasury` address and `token_address`. Send USDC from your sign-in wallet to that treasury
address; the wallet needs a little ETH on Base for the transaction fee. Then `POST /v1/account/deposits/claim`
with `{"tx_hash":"0x..."}`; repeat after a few seconds if the grid has not seen the transaction yet. The
smallest deposit that is credited is 0.01 USD. Credit cannot be withdrawn or moved to another account. Read
the treasury address from the API every time; do not take it from a document, this one included.

**Daily allowance for holders.** Once a day the grid reads the AIPG balance of your sign-in wallet on Base.
Holding at least 10,000 AIPG gives 0.10 USD of credit per day, 100,000 AIPG gives 0.50 USD per day,
1,000,000 AIPG gives 2.00 USD per day. The tokens are not spent; they stay in your wallet, and the allowance
is granted again each day while they are held. Conditions: it can only be spent on the grid, it does not
add up over days, the first one comes the day after the tokens arrive, the network grants a limited total
per day, and the tiers are the grid's decision and can change. The current tiers are in
`GET /v1/account/credits` under `free.holder_tiers`. This file says nothing about the token's price or
whether to acquire it.

## Ready-made integrations

All community-written and unofficial.

- OpenClaw: plugin `clawhub:openclaw-aipg-provider` (text, images, video, wallet sign-in built in) and skill
  `ai-power-grid`. Source: https://github.com/speteai/openclaw-aipg-provider
- Hermes Agent: https://github.com/speteai/hermes-aipg-provider
- Goose, Aider, Continue: https://github.com/speteai/aipg-agent-guides

## Tell your human

When you are done, report what you did: the wallet address you signed in with, where the API key file is,
the credit, and anything you spent. Problems with this file:
https://github.com/speteai/aipg-agent-guides/issues
