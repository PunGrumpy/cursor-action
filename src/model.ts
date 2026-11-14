import type { ModelListItem, ModelSelection } from "@cursor/sdk";

type ModelParam = NonNullable<ModelSelection["params"]>[number];

const USAGE =
  "Use <id> or <id>[<param>=<value>,...], for example grok-4.7[reasoning_effort=medium].";

const invalid = (raw: string, reason: string): Error =>
  new Error(`Invalid 'model' value: '${raw}'. ${reason}. ${USAGE}`);

const fail = (raw: string, reason: string): never => {
  throw invalid(raw, reason);
};

const parseParam = (raw: string, entry: string): ModelParam => {
  if (entry.trim() === "") {
    return fail(raw, "Found an empty entry between commas");
  }
  const parts = entry.split("=");
  if (parts.length === 1) {
    return fail(raw, `Entry '${entry.trim()}' has no '='`);
  }
  if (parts.length > 2) {
    return fail(raw, `Entry '${entry.trim()}' has more than one '='`);
  }
  const name = parts[0]?.trim() ?? "";
  const value = parts[1]?.trim() ?? "";
  if (name === "") {
    return fail(raw, "A parameter has an empty name");
  }
  if (value === "") {
    return fail(raw, `Parameter '${name}' has an empty value`);
  }
  if (name.includes("[") || value.includes("[")) {
    return fail(raw, `Unexpected '[' in entry '${entry.trim()}'`);
  }
  return { id: name, value };
};

/** Parses `<id>` or `<id>[<param>=<value>,...]`, the official CLI's --model syntax. */
export const parseModel = (raw: string): ModelSelection => {
  const text = raw.trim();
  const open = text.indexOf("[");

  if (open === -1) {
    if (text.includes("]")) {
      return fail(raw, "Found ']' without a matching '['");
    }
    if (text === "") {
      return fail(raw, "The model id is empty");
    }
    return { id: text };
  }

  const id = text.slice(0, open).trim();
  if (id === "") {
    return fail(raw, "The model id before '[' is empty");
  }
  if (id.includes("]")) {
    return fail(raw, "Found ']' before '['");
  }

  const close = text.indexOf("]", open);
  if (close === -1) {
    return fail(raw, "Missing closing ']'");
  }
  if (close !== text.length - 1) {
    return fail(raw, "Unexpected text after ']'");
  }

  const body = text.slice(open + 1, close);
  if (body.trim() === "") {
    return fail(raw, "The brackets are empty");
  }

  const params: ModelParam[] = [];
  const seen = new Set<string>();
  for (const entry of body.split(",")) {
    const param = parseParam(raw, entry);
    if (seen.has(param.id)) {
      return fail(raw, `Parameter '${param.id}' appears more than once`);
    }
    seen.add(param.id);
    params.push(param);
  }
  return { id, params };
};

/** Inverse of parseModel, for the log line. `grok-4.7[reasoning_effort=medium,fast=false]`. */
export const formatModel = (model: ModelSelection): string => {
  if (!model.params || model.params.length === 0) {
    return model.id;
  }
  const entries = model.params.map(({ id, value }) => `${id}=${value}`);
  return `${model.id}[${entries.join(",")}]`;
};

const formatVariant = (
  id: string,
  variant: NonNullable<ModelListItem["variants"]>[number]
): string => {
  const selection = formatModel({ id, params: variant.params });
  const flags = `${variant.isDefault ? " [default]" : ""}${variant.isMaxMode ? " [max mode]" : ""}`;
  return `  - ${selection} (${variant.displayName})${flags}`;
};

/** Lists each model and its variants in the exact form the `model` input accepts. */
export const formatCatalog = (models: readonly ModelListItem[]): string => {
  const lines = ["Models this API key can use:"];
  for (const model of models) {
    lines.push(`- ${model.id} (${model.displayName})`);
    for (const variant of model.variants ?? []) {
      lines.push(formatVariant(model.id, variant));
    }
  }
  return lines.join("\n");
};

/**
 * Fills in the catalog's default settings for a model the author gave fewer
 * settings than it has. Cursor does not apply them itself, and rejects a
 * parameterized model that arrives without them on plans with fixed settings.
 * The author's values win and keep the default variant's order.
 */
export const withDefaultSettings = (
  selection: ModelSelection,
  catalog: readonly ModelListItem[]
): ModelSelection => {
  const entry = catalog.find(
    ({ aliases, id }) => id === selection.id || aliases?.includes(selection.id)
  );
  const defaults = entry?.variants?.find(
    (variant) => variant.isDefault
  )?.params;
  if (!defaults || defaults.length === 0) {
    return selection;
  }

  const authored = selection.params ?? [];
  const authoredValues = new Map(authored.map(({ id, value }) => [id, value]));
  const params = defaults.map(({ id, value }) => ({
    id,
    value: authoredValues.get(id) ?? value,
  }));
  const defaultIds = new Set(defaults.map(({ id }) => id));
  for (const param of authored) {
    if (!defaultIds.has(param.id)) {
      params.push({ ...param });
    }
  }
  return { id: selection.id, params };
};
