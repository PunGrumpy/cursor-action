/**
 * Renders the inputs/outputs reference from `action.yml` into every place that
 * documents it. The action's own manifest is the single source of truth, so an
 * input can never be documented with a default it does not have.
 *
 * Run with `bun run docs:reference`. CI runs it too and fails when the working
 * tree changes, the same way it fails on a stale `dist/`.
 */
const ACTION_MANIFEST = "action.yml";
const README = "README.md";
const DOCS_REFERENCE = "docs/content/reference.mdx";

/**
 * MDX parses `<!--` as JSX and rejects it, so the two targets cannot share a
 * marker syntax.
 */
const TARGETS = [
  {
    end: "<!-- reference:end -->",
    file: README,
    start: "<!-- reference:start -->",
  },
  {
    end: "{/* reference:end */}",
    file: DOCS_REFERENCE,
    start: "{/* reference:start */}",
  },
];

interface ManifestInput {
  description: string;
  required?: boolean;
  default?: string;
}

interface Manifest {
  inputs: Record<string, ManifestInput>;
  outputs: Record<string, { description: string }>;
}

const escapeCell = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll("\n", " ").trim();

const renderTable = (rows: string[][]): string => {
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => row[column].length))
  );
  const line = (row: string[]): string =>
    `| ${row.map((cell, i) => cell.padEnd(widths[i])).join(" | ")} |`;
  const divider = `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`;

  return [line(rows[0]), divider, ...rows.slice(1).map(line)].join("\n");
};

const renderReference = (manifest: Manifest): string => {
  const inputs = renderTable([
    ["Input", "Required", "Default", "Description"],
    ...Object.entries(manifest.inputs).map(([name, input]) => [
      `\`${name}\``,
      input.required ? "✅" : "❌",
      input.default === undefined ? "—" : `\`${input.default}\``,
      escapeCell(input.description),
    ]),
  ]);

  const outputs = renderTable([
    ["Output", "Description"],
    ...Object.entries(manifest.outputs).map(([name, output]) => [
      `\`${name}\``,
      escapeCell(output.description),
    ]),
  ]);

  return `### Inputs\n\n${inputs}\n\n### Outputs\n\n${outputs}`;
};

const replaceBlock = (
  source: string,
  block: string,
  target: (typeof TARGETS)[number]
): string => {
  const start = source.indexOf(target.start);
  const end = source.indexOf(target.end);

  if (start === -1 || end === -1) {
    throw new Error(
      `${target.file} is missing the ${target.start} / ${target.end} markers that delimit the generated reference.`
    );
  }

  return `${source.slice(0, start + target.start.length)}\n\n${block}\n\n${source.slice(end)}`;
};

const manifest = Bun.YAML.parse(
  await Bun.file(ACTION_MANIFEST).text()
) as Manifest;
const reference = renderReference(manifest);

await Promise.all(
  TARGETS.map(async (target) => {
    const current = await Bun.file(target.file).text();
    await Bun.write(target.file, replaceBlock(current, reference, target));
  })
);

// oxfmt re-aligns markdown tables, and it measures ✅ / ❌ as two columns wide.
// Letting it own the final shape is what keeps `bun run format` from undoing
// this script — and this script from undoing `bun run format`.
await Bun.$`bunx oxfmt ${README}`.quiet();

console.log(`Wrote ${README} and ${DOCS_REFERENCE} from ${ACTION_MANIFEST}.`);
