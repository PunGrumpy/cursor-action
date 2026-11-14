import { describe, expect, it } from "bun:test";

import type { ModelListItem } from "@cursor/sdk";

import {
  formatCatalog,
  formatModel,
  parseModel,
  withDefaultSettings,
} from "../src/model";

describe("parseModel", () => {
  const valid: [string, string, unknown][] = [
    ["a plain id", "composer-2.5", { id: "composer-2.5" }],
    ["a plain id with outer whitespace", "  grok-4.7  ", { id: "grok-4.7" }],
    [
      "a Grok selection",
      "grok-4.7[reasoning_effort=medium]",
      { id: "grok-4.7", params: [{ id: "reasoning_effort", value: "medium" }] },
    ],
    [
      "several params in author order",
      "grok-4.7[reasoning_effort=high,fast=false,context=1m]",
      {
        id: "grok-4.7",
        params: [
          { id: "reasoning_effort", value: "high" },
          { id: "fast", value: "false" },
          { id: "context", value: "1m" },
        ],
      },
    ],
    [
      "whitespace around brackets, commas, and equals",
      "  grok-4.7 [ reasoning_effort = medium , fast = false ]  ",
      {
        id: "grok-4.7",
        params: [
          { id: "reasoning_effort", value: "medium" },
          { id: "fast", value: "false" },
        ],
      },
    ],
    [
      "values verbatim, without case changes",
      "m[Effort=High]",
      { id: "m", params: [{ id: "Effort", value: "High" }] },
    ],
  ];

  for (const [name, raw, expected] of valid) {
    it(`parses ${name}`, () => {
      expect(parseModel(raw)).toEqual(expected as never);
    });
  }

  it("leaves params off a plain id", () => {
    expect(parseModel("composer-2.5")).not.toHaveProperty("params");
  });

  const invalid: [string, string, string][] = [
    ["an empty value", "", "id is empty"],
    ["a stray ']'", "grok-4.7]", "without a matching '['"],
    ["a missing ']'", "grok-4.7[fast=true", "Missing closing ']'"],
    ["text after ']'", "grok-4.7[fast=true]x", "Unexpected text after ']'"],
    ["a second bracket group", "m[a=b][c=d]", "Unexpected text after ']'"],
    ["an empty id", "[fast=true]", "id before '[' is empty"],
    ["a ']' before '['", "a]b[c=d]", "']' before '['"],
    ["empty brackets", "grok-4.7[]", "brackets are empty"],
    ["an entry without '='", "grok-4.7[fast]", "has no '='"],
    ["an entry with two '='", "grok-4.7[a=b=c]", "more than one '='"],
    ["an empty name", "grok-4.7[=true]", "empty name"],
    ["an empty value", "grok-4.7[fast=]", "empty value"],
    ["a trailing comma", "grok-4.7[fast=true,]", "empty entry"],
    ["a nested '['", "grok-4.7[fast=[true]]", "Unexpected text after ']'"],
    ["a '[' in a value", "grok-4.7[fast=tr[ue]", "Unexpected '['"],
    ["a duplicate name", "grok-4.7[fast=true,fast=false]", "more than once"],
  ];

  for (const [name, raw, reason] of invalid) {
    it(`rejects ${name}`, () => {
      expect(() => parseModel(raw)).toThrow(reason);
    });
  }

  it("quotes the raw value and shows the accepted forms", () => {
    expect(() => parseModel("grok-4.7[fast")).toThrow(
      "Invalid 'model' value: 'grok-4.7[fast'. Missing closing ']'. " +
        "Use <id> or <id>[<param>=<value>,...], for example grok-4.7[reasoning_effort=medium]."
    );
  });
});

describe("formatModel", () => {
  it("prints a plain id as is", () => {
    expect(formatModel({ id: "composer-2.5" })).toBe("composer-2.5");
  });

  it("prints params in order", () => {
    expect(
      formatModel({
        id: "grok-4.7",
        params: [
          { id: "reasoning_effort", value: "medium" },
          { id: "fast", value: "false" },
        ],
      })
    ).toBe("grok-4.7[reasoning_effort=medium,fast=false]");
  });

  it("round-trips through parseModel", () => {
    for (const raw of [
      "composer-2.5",
      "grok-4.7[reasoning_effort=medium]",
      "m[a=1,b=2,c=3]",
    ]) {
      const model = parseModel(raw);
      expect(parseModel(formatModel(model))).toEqual(model);
    }
  });
});

describe("formatCatalog", () => {
  const catalog: ModelListItem[] = [
    {
      displayName: "Grok 4.7",
      id: "grok-4.7",
      variants: [
        {
          displayName: "Medium",
          isDefault: true,
          params: [{ id: "reasoning_effort", value: "medium" }],
        },
        {
          displayName: "High Max",
          isMaxMode: true,
          params: [
            { id: "reasoning_effort", value: "high" },
            { id: "fast", value: "false" },
          ],
        },
        { displayName: "Plain", params: [] },
      ],
    },
    { displayName: "Composer 2.5", id: "composer-2.5" },
  ];

  it("lists each model with its variants in catalog order", () => {
    expect(formatCatalog(catalog)).toBe(
      [
        "Models this API key can use:",
        "- grok-4.7 (Grok 4.7)",
        "  - grok-4.7[reasoning_effort=medium] (Medium) [default]",
        "  - grok-4.7[reasoning_effort=high,fast=false] (High Max) [max mode]",
        "  - grok-4.7 (Plain)",
        "- composer-2.5 (Composer 2.5)",
      ].join("\n")
    );
  });

  it("lists only the header for an empty catalog", () => {
    expect(formatCatalog([])).toBe("Models this API key can use:");
  });

  it("prints selections that parseModel accepts", () => {
    for (const model of catalog) {
      for (const variant of model.variants ?? []) {
        const selection = { id: model.id, params: variant.params };
        const listed = formatModel(selection);
        expect(parseModel(listed)).toEqual(
          variant.params.length === 0 ? { id: model.id } : selection
        );
      }
    }
  });
});

describe("withDefaultSettings", () => {
  const catalog: ModelListItem[] = [
    {
      displayName: "Grok 4.7",
      id: "grok-4.7",
      variants: [
        {
          displayName: "Grok 4.7 Medium",
          isDefault: true,
          params: [
            { id: "context", value: "256k" },
            { id: "reasoning_effort", value: "medium" },
            { id: "fast", value: "false" },
          ],
        },
        {
          displayName: "Grok 4.7 High",
          params: [{ id: "reasoning_effort", value: "high" }],
        },
      ],
    },
    {
      aliases: ["composer"],
      displayName: "Composer 2.5",
      id: "composer-2.5",
      variants: [
        {
          displayName: "Composer 2.5",
          isDefault: true,
          params: [{ id: "fast", value: "false" }],
        },
      ],
    },
    {
      displayName: "No default",
      id: "no-default",
      variants: [{ displayName: "Only", params: [{ id: "a", value: "1" }] }],
    },
    {
      displayName: "Plain",
      id: "plain",
      variants: [{ displayName: "Plain", isDefault: true, params: [] }],
    },
  ];

  it("gives a bare id the default variant's settings in catalog order", () => {
    expect(withDefaultSettings({ id: "grok-4.7" }, catalog)).toEqual({
      id: "grok-4.7",
      params: [
        { id: "context", value: "256k" },
        { id: "reasoning_effort", value: "medium" },
        { id: "fast", value: "false" },
      ],
    });
  });

  it("replaces only the settings the author gave and keeps the order", () => {
    const result = withDefaultSettings(
      { id: "grok-4.7", params: [{ id: "fast", value: "true" }] },
      catalog
    );
    expect(formatModel(result)).toBe(
      "grok-4.7[context=256k,reasoning_effort=medium,fast=true]"
    );
  });

  it("appends author settings the default variant does not have", () => {
    const result = withDefaultSettings(
      {
        id: "composer-2.5",
        params: [
          { id: "extra", value: "x" },
          { id: "fast", value: "true" },
        ],
      },
      catalog
    );
    expect(formatModel(result)).toBe("composer-2.5[fast=true,extra=x]");
  });

  it("finds the model by alias and keeps the id as written", () => {
    expect(withDefaultSettings({ id: "composer" }, catalog)).toEqual({
      id: "composer",
      params: [{ id: "fast", value: "false" }],
    });
  });

  it("returns the selection unchanged when the catalog cannot help", () => {
    for (const id of ["unknown", "no-default", "plain"]) {
      const selection = { id, params: [{ id: "a", value: "b" }] };
      expect(withDefaultSettings(selection, catalog)).toEqual(selection);
    }
    expect(withDefaultSettings({ id: "grok-4.7" }, [])).toEqual({
      id: "grok-4.7",
    });
  });
});
