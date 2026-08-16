/**
 * The window chrome cursor.com floats over its hero panel: a 10px radius, a
 * 28px title bar with three 10px dots at 20% of the foreground and a centred
 * label at 70% opacity, and a two-layer shadow closed off by a 1px border.
 */
export const Window = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div
    className="bg-fd-card overflow-hidden rounded-[10px]"
    style={{
      boxShadow:
        "0 28px 70px rgb(0 0 0 / 0.14), 0 14px 32px rgb(0 0 0 / 0.1), 0 0 0 1px var(--color-fd-border)",
    }}
  >
    <div className="border-fd-border relative flex h-7 items-center border-b px-2">
      <div aria-hidden="true" className="flex items-center gap-1.5">
        <span className="bg-fd-foreground/20 inline-block size-2.5 rounded-full" />
        <span className="bg-fd-foreground/20 inline-block size-2.5 rounded-full" />
        <span className="bg-fd-foreground/20 inline-block size-2.5 rounded-full" />
      </div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-center text-[13px] opacity-70">
        {label}
      </div>
    </div>
    {children}
  </div>
);
