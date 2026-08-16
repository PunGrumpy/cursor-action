import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";

import { MARKETPLACE, REPO } from "../lib/links";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

const FOOTER: FooterColumn[] = [
  {
    heading: "Documentation",
    links: [
      { href: "/quickstart", label: "Quickstart" },
      { href: "/reference", label: "Reference" },
      { href: "/examples", label: "Examples" },
      { href: "/behaviour", label: "Behaviour" },
      { href: "/troubleshooting", label: "Troubleshooting" },
    ],
  },
  {
    heading: "Project",
    links: [
      { external: true, href: REPO, label: "GitHub" },
      { external: true, href: MARKETPLACE, label: "Marketplace" },
      {
        external: true,
        href: "https://www.npmjs.com/package/@pungrumpy/cursor-action",
        label: "npm",
      },
      { external: true, href: `${REPO}/releases`, label: "Releases" },
      {
        external: true,
        href: `${REPO}/blob/main/CHANGELOG.md`,
        label: "Changelog",
      },
    ],
  },
  {
    heading: "Community",
    links: [
      { external: true, href: `${REPO}/issues`, label: "Issues" },
      {
        external: true,
        href: `${REPO}/blob/main/.github/CONTRIBUTING.md`,
        label: "Contributing",
      },
      {
        external: true,
        href: `${REPO}/blob/main/.github/CODE_OF_CONDUCT.md`,
        label: "Code of conduct",
      },
      {
        external: true,
        href: `${REPO}/issues/new?template=bug_report.md`,
        label: "Report a bug",
      },
      {
        external: true,
        href: `${REPO}/issues/new?template=feature_request.md`,
        label: "Request a feature",
      },
    ],
  },
  {
    heading: "Credits",
    links: [
      { external: true, href: "https://cursor.com", label: "Cursor" },
      {
        external: true,
        href: "https://www.npmjs.com/package/@cursor/sdk",
        label: "@cursor/sdk",
      },
      {
        external: true,
        href: "https://press.fumadocs.dev",
        label: "Fumapress",
      },
      {
        external: true,
        href: "https://commons.wikimedia.org/wiki/File:Bierstadt-Alaskan_Coastal_Range.jpg",
        label: "Bierstadt painting",
      },
    ],
  },
  {
    heading: "Legal",
    links: [
      {
        external: true,
        href: `${REPO}/blob/main/LICENSE`,
        label: "MIT licence",
      },
    ],
  },
];

/**
 * Their footer sits on the card surface and runs five link columns across the
 * container: headings in the secondary colour, links in the primary one, and
 * the external-link arrow hidden until hover so it is there when you reach for
 * the link and out of the way while you read. The bottom bar splits the
 * copyright from the appearance control.
 *
 * The gutter is on the container, not on the `<footer>` — the background has to
 * run to the viewport edge while the columns line up with the header above.
 */
export const SiteFooter = () => (
  <footer className="bg-fd-card mt-24">
    <div className="mx-auto max-w-6xl px-5 pt-16 pb-12">
      <nav className="mb-20 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
        {FOOTER.map((column) => (
          <div key={column.heading}>
            <h3 className="text-fd-muted-foreground pb-2 text-sm">
              {column.heading}
            </h3>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    className="group text-fd-foreground focus-visible:outline-fd-ring inline-block py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={link.href}
                    {...(link.external
                      ? { rel: "noreferrer", target: "_blank" }
                      : {})}
                  >
                    {link.label}
                    {link.external ? (
                      <span
                        aria-hidden="true"
                        className="inline-block opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      >
                        &nbsp;↗
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="text-fd-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-1">
          <small className="text-sm">
            © 2026{" "}
            <a
              className="hover:text-fd-foreground focus-visible:outline-fd-ring focus-visible:outline-2 focus-visible:outline-offset-2"
              href="https://www.pungrumpy.com"
              rel="noreferrer"
              target="_blank"
            >
              Noppakorn Kaewsalabnil
            </a>
          </small>
          <small className="text-sm">
            Not affiliated with or endorsed by Cursor
          </small>
        </div>
        {/* Closing the gap opened by not using Fumapress's own nav: without
            this the home page had no way to change appearance. */}
        <ThemeSwitch mode="light-dark-system" />
      </div>
    </div>
  </footer>
);
