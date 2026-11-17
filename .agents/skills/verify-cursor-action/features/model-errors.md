# Model errors

## Sub-features

- A model the key cannot use fails the step with the SDK's message.
- On a model error the action logs the models the key can use.

## How to get to it (user POV)

A workflow sets `model` to an id the key's plan does not include.

## Driving it with drive.mjs

```sh
node .agents/skills/verify-cursor-action/scripts/drive.mjs --scenario model-error --model missing-model
```

Proof: `exitCode` is `1`, `outputs.status` is `error`, `action.log` carries "Cannot use this model", and `action.log` lists `stub-model` from the catalog.

## Gotchas

- `stub-events.jsonl` holds only `create`. The agent never exists, so there is no `dispose`.
