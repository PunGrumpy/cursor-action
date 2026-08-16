import { MARKETPLACE, REPO } from "../lib/links";
import { Mark } from "./mark";

const NAV_LINKS = [
  { href: "/quickstart", label: "Quickstart" },
  { href: "/reference", label: "Reference" },
  { href: "/examples", label: "Examples" },
  { href: "/behaviour", label: "Behaviour" },
];

/**
 * cursor.com's header is a three-column grid — logo, nav, actions — 56px tall
 * and fixed to the top, with no bottom border. The nav is not centred by the
 * grid: it is absolutely positioned at 50% and pulled back by half its own
 * size, so it stays centred on the viewport however wide the logo and the
 * action cluster grow.
 *
 * The action cluster is a plain text link, then a ghost pill bordered at 20%
 * of the foreground, then the filled pill. Both pills are `.btn--sm`.
 */
export const SiteHeader = () => (
  <header className="bg-fd-background fixed top-0 left-0 z-50 w-full">
    <div className="relative mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto] items-center px-5 lg:grid-cols-[auto_1fr_auto]">
      <a
        className="bg-fd-foreground text-fd-background absolute top-2 left-5 -translate-y-full rounded-full px-4 py-2 text-sm opacity-0 transition-transform focus:translate-y-0 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
        href="#main"
      >
        Skip to content
      </a>

      <a
        className="col-start-1 col-end-2 row-start-1 row-end-2 inline-flex items-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
        href="/"
      >
        <Mark className="size-[22px]" />
        Cursor Action
      </a>

      <div className="hidden lg:block">
        <nav className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ul className="flex items-center justify-center">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  className="text-fd-muted-foreground hover:text-fd-foreground rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex items-center gap-2 justify-self-end lg:col-start-3 lg:col-end-[-1]">
        <a
          className="rounded-full p-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring lg:hidden"
          href="/quickstart"
        >
          Docs
        </a>
        <a
          className="border-fd-foreground/20 hover:bg-fd-accent hidden rounded-full border px-[0.8em] pt-[0.45em] pb-[0.46em] text-sm leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring lg:inline-flex"
          href={MARKETPLACE}
          rel="noreferrer"
          target="_blank"
        >
          Marketplace
        </a>
        <a
          className="bg-fd-foreground text-fd-background inline-flex rounded-full px-[0.8em] pt-[0.45em] pb-[0.46em] text-sm leading-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
          href={REPO}
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </div>
    </div>
  </header>
);
