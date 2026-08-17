"use client";

import { cn } from "cnfast";
import { useTheme } from "fumadocs-ui/provider/base";
import type { ComponentProps } from "react";
import { useCallback, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

type ThemeSwitchProps = ComponentProps<"div"> & {
  mode?: "light-dark" | "light-dark-system";
};

interface Thumb {
  left: number;
  width: number;
}

const THEMES = [
  {
    icon: {
      d: "M2.5 5.25C2.5 3.45 3.96 2 5.75 2h4.5c1.8 0 3.25 1.46 3.25 3.25V14h-11V5.25M5.75 3.5C4.78 3.5 4 4.28 4 5.25v7.25h8V5.25c0-.97-.78-1.75-1.75-1.75zM5 5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V9H5zm3.5 6H11V10H8.5z",
      rule: "evenodd",
    },
    label: "System theme",
    value: "system",
  },
  {
    icon: {
      d: "M8.75 2v-.75h-1.5V3h1.5V2M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.75 1.5v1.75h-1.5V13zM13 7.25h1.75v1.5H13zm-11 0h-.75v1.5H3v-1.5H2m9-3.32.54-.53.17-.17.53-.53 1.06 1.06-.53.53-.17.17-.53.53zm-7.77 7.78-.53.53 1.06 1.06.53-.53.17-.17.53-.53L3.93 11l-.53.53zM3.93 5l-.53-.53-.17-.17-.53-.53L3.76 2.7l.53.53.17.17.53.53zm7.78 7.78.53.53 1.06-1.06-.53-.53-.17-.17-.53-.53L11 12.07l.53.53z",
      rule: "evenodd",
    },
    label: "Light theme",
    value: "light",
  },
  {
    icon: {
      d: "m6.3 3.3.7.25A4.25 4.25 0 0 0 12.45 9l.96.96-.08.2A5.75 5.75 0 1 1 6.04 2.6zM5.25 4.76a4.24 4.24 0 1 0 6 5.99H11a5.75 5.75 0 0 1-5.75-6M12.5 3.5h1.25V5H12.5v1.25H11V5H9.75V3.5H11V2.25h1.5zM7 3.55l-.7-.25-.26-.7z",
      rule: "nonzero",
    },
    label: "Dark theme",
    value: "dark",
  },
] as const;

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const onClient = () => true;
const onServer = () => false;

export const ThemeSwitch = ({
  className,
  mode = "light-dark-system",
  ...props
}: ThemeSwitchProps) => {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const hydrated = useSyncExternalStore(subscribe, onClient, onServer);
  const [thumb, setThumb] = useState<Thumb | null>(null);

  const measure = useCallback((cell: HTMLButtonElement | null) => {
    if (!cell) {
      return;
    }

    const place = () =>
      setThumb({ left: cell.offsetLeft, width: cell.offsetWidth });

    place();
    const observer = new ResizeObserver(place);
    observer.observe(cell);

    return () => observer.disconnect();
  }, []);

  const themes =
    mode === "light-dark"
      ? THEMES.filter((option) => option.value !== "system")
      : THEMES;
  const selected = mode === "light-dark" ? resolvedTheme : theme;
  const active = hydrated ? selected : null;

  const change = (value: string) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => flushSync(() => setTheme(value)));
    } else {
      setTheme(value);
    }
  };

  return (
    <div
      className={cn(
        className,
        "bg-fd-secondary/50 ring-fd-foreground/20 relative flex rounded-full p-0.5 ring-1 *:rounded-full"
      )}
      data-theme-toggle=""
      {...props}
    >
      {thumb ? (
        <div
          aria-hidden="true"
          className="bg-fd-background dark:bg-fd-accent ring-fd-foreground/50 pointer-events-none absolute top-0.5 bottom-0.5 rounded-full shadow-sm ring-1 transition-[left,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
          style={{ left: thumb.left, width: thumb.width }}
        />
      ) : null}

      {themes.map((option) => (
        <button
          aria-label={option.label}
          aria-pressed={active === option.value}
          className={cn(
            "focus-visible:outline-fd-ring relative inline-flex cursor-pointer items-center justify-center rounded-full px-2.5 py-1.5 leading-none transition-colors focus-visible:outline-2",
            active === option.value
              ? "text-fd-foreground"
              : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
          key={option.value}
          onClick={() => change(option.value)}
          ref={active === option.value ? measure : null}
          type="button"
        >
          <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16">
            <path
              clipRule={option.icon.rule}
              d={option.icon.d}
              fill="currentColor"
              fillRule={option.icon.rule}
            />
          </svg>
        </button>
      ))}
    </div>
  );
};
