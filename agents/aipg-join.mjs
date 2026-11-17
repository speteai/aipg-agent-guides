#!/usr/bin/env node
// Gives an agent with an EVM wallet its own AI Power Grid account and API key.
// Community-written, not an official AIPG file. Talks only to api.aipowergrid.io.
//
//   npm install viem
//   AIPG_WALLET_KEY_FILE=/path/to/wallet.key node aipg-join.mjs
//
// AIPG_WALLET_KEY_FILE  file holding the wallet's private key (0x + 64 hex). Read locally to sign
//                       one sign-in message; the key itself is never sent anywhere.
// AIPG_KEY_FILE         where the new API key is written (default ~/.config/aipg/api.key, mode 0600).
// --create-wallet       make a new wallet if the key file does not exist yet.
//
// Run it again at any time: with a key file in place it only reports the account's state.
// Neither the private key nor the API key is printed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const API = "https://api.aipowergrid.io/v1";
const walletFile = process.env.AIPG_WALLET_KEY_FILE;
const keyFile = process.env.AIPG_KEY_FILE || path.join(os.homedir(), ".config", "aipg", "api.key");
const out = { ok: false };
const done = (code) => { console.log(JSON.stringify(out, null, 2)); process.exit(code); };
const fail = (step, why) => { out.failed_at = step; out.reason = why; done(1); };

async function call(p, opt = {}) {
  const r = await fetch(API + p, {
    ...opt,
    headers: { "Content-Type": "application/json", "User-Agent": "aipg-join/1", ...(opt.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status, body };
}
const short = (b) => JSON.stringify(b && (b.detail || b.error || b)).slice(0, 200);

let apiKey = fs.existsSync(keyFile) ? fs.readFileSync(keyFile, "utf8").trim() : "";

if (!apiKey) {
  if (!walletFile) fail("wallet", "set AIPG_WALLET_KEY_FILE to the file that holds the wallet's private key");
  if (!fs.existsSync(walletFile)) {
    if (!process.argv.includes("--create-wallet")) fail("wallet", `${walletFile} does not exist; pass --create-wallet to make a new wallet`);
    fs.mkdirSync(path.dirname(walletFile), { recursive: true, mode: 0o700 });
    fs.writeFileSync(walletFile, generatePrivateKey(), { mode: 0o600 });
    out.wallet_created = true;
  }
  let acct;
  try { acct = privateKeyToAccount(fs.readFileSync(walletFile, "utf8").trim()); }
  catch { fail("wallet", "the key file does not hold a valid private key (0x + 64 hex characters)"); }
  out.address = acct.address;

  const ch = await call("/accounts/wallet/challenge", {
    method: "POST",
    body: JSON.stringify({ address: acct.address, domain: "console.aipowergrid.io", uri: "https://console.aipowergrid.io", chain_id: 8453 }),
  });
  if (ch.status !== 200 || !ch.body?.message) fail("challenge", `HTTP ${ch.status} ${short(ch.body)}`);

  // A sign-in message: signing it moves nothing and approves no transfer. It is checked and shown.
  const msg = ch.body.message;
  if (!msg.startsWith("console.aipowergrid.io wants you to sign in") || !msg.includes(acct.address) || !/Chain ID: 8453\b/.test(msg))
    fail("challenge", "the sign-in message is not the expected one, nothing was signed: " + msg.slice(0, 300));
  out.signed_message = msg;
  const signature = await acct.signMessage({ message: ch.body.message });
  const vf = await call("/accounts/wallet/verify", {
    method: "POST",
    body: JSON.stringify({ message: ch.body.message, signature, address: acct.address }),
  });
  if (vf.status !== 200 || !vf.body?.access_token) fail("verify", `HTTP ${vf.status} ${short(vf.body)}`);

  const mk = await call("/account/keys", {
    method: "POST",
    headers: { Authorization: "Bearer " + vf.body.access_token },
    body: JSON.stringify({ label: "agent " + new Date().toISOString().slice(0, 10) }),
  });
  if (mk.status !== 200 || !mk.body?.api_key) fail("create key", `HTTP ${mk.status} ${short(mk.body)}`);
  apiKey = mk.body.api_key;
  fs.mkdirSync(path.dirname(keyFile), { recursive: true, mode: 0o700 });
  fs.writeFileSync(keyFile, apiKey + "\n", { mode: 0o600 });
  out.key_created = true;
}
out.key_file = keyFile;

const auth = { Authorization: "Bearer " + apiKey };
const cr = await call("/account/credits", { headers: auth });
if (cr.status !== 200) fail("credits", `HTTP ${cr.status} ${short(cr.body)}`);
out.credit_usd = cr.body.total_spendable_usd;
out.daily_allowance_usd = cr.body.free?.daily_cap_usd ?? 0;
out.holder_allowance_active = !!cr.body.free?.holder_bonus_active;
out.holder_tiers = (cr.body.free?.holder_tiers || []).map((t) => ({ hold_at_least_aipg: t.min_aipg, usd_per_day: t.daily_usd }));

const st = await call("/status/models");
if (Array.isArray(st.body)) out.text_models_online = st.body.filter((m) => m.type === "text" && m.count > 0).map((m) => m.name);

out.base_url = API;
out.ok = true;
out.next = out.credit_usd > 0
  ? "Ready: use base_url with the key in key_file in any OpenAI-compatible client."
  : "The account works but has no credit yet. See 'Getting credit' in skill.md.";
done(0);
