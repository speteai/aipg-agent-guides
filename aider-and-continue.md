# AI Power Grid with Aider and Continue

Community notes, not an official AIPG document. Tested on 2026-11-15 on Linux x64 against the live grid
(`https://api.aipowergrid.io/v1`) with Aider 0.86.2 and the Continue CLI (`cn`) 1.5.47.

Both talk to the grid as an ordinary OpenAI-compatible endpoint. No plugin is needed.

## Which model

| Model | Aider | Continue CLI |
| --- | --- | --- |
| `qwen38-flash-next-nvfp4` | works: wrote a correct script in 11 s (849 tokens sent, 618 received) | works: wrote the script, ran it, wrote the result file, 9 s |
| `gpt-oss-120b` | works: wrote a correct script in 18 s (802 sent, 424 received) | fails: the run ends after 5 s with no output and no files |

Aider does not use tool calls; it asks the model for file edits as text. That is why `gpt-oss-120b` works
there. Continue uses tool calls, and on `gpt-oss-120b` the grid currently returns them inside the
reasoning text ([aipg-documentation#70](https://github.com/AIPowerGrid/aipg-documentation/issues/70)).

Test task for Aider: "Write a Python script total.py that reads items.csv from the current directory and
prints the total value (qty times price summed) as a plain number." The script was then run by hand and
printed the right number. Test task for Continue: the same, plus "Run it, and write the printed number
into report.txt. Tell me the number."

## Aider

```bash
export OPENAI_API_BASE=https://api.aipowergrid.io/v1
export OPENAI_API_KEY=grid_...            # your Grid API key

aider --model openai/qwen38-flash-next-nvfp4 --no-show-model-warnings
```

The `openai/` prefix tells Aider to use the OpenAI-compatible address. Aider does not know the grid's
models, so without `--no-show-model-warnings` it prints a warning about an unknown model and its
context size; the run works either way.

## Continue

In `~/.continue/config.yaml`:

```yaml
name: AI Power Grid
version: 1.0.0
schema: v1
models:
  - name: Grid Qwen
    provider: openai
    model: qwen38-flash-next-nvfp4
    apiBase: https://api.aipowergrid.io/v1
    apiKey: ${{ secrets.AIPG_API_KEY }}
    roles: [chat, edit, apply]
    capabilities: [tool_use]
```

and the key in the environment:

```bash
export AIPG_API_KEY=grid_...              # your Grid API key
cn -p --auto "List the files here and say what each one is."
```

`cn -p` runs one prompt and prints the answer; `--auto` lets it use its tools without asking. The CLI ran
without a Continue account.

Note on Continue: the CLI on npm was last published in June 2026, and the project's README says it is no
longer actively maintained. The settings above are for that last version.

## Things to know

- Prompts are processed in plain text on computers run by independent operators. Do not point a coding
  tool at confidential code without thinking about that.
- Not tested here: the Continue extensions for VS Code and JetBrains (same config file, but only the CLI
  was run), autocomplete, Windows and macOS, long sessions, and Aider with a git repository (the test
  used `--no-git`).
