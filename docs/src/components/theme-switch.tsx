"use client";

import { cn } from "cnfast";
import { useTheme } from "fumadocs-ui/provider/base";
import type { ComponentProps } from "react";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

type ThemeSwitchProps = ComponentProps<"div"> & {
  mode?: "light-dark" | "light-dark-system";
};

const THEMES = [
  { glyph: "🖥", label: "System theme", value: "system" },
  { glyph: "☉", label: "Light theme", value: "light" },
  { glyph: "☾", label: "Dark theme", value: "dark" },
] as const;

const STEP = 100;

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

  const themes =
    mode === "light-dark"
      ? THEMES.filter((option) => option.value !== "system")
      : THEMES;
  const selected = mode === "light-dark" ? resolvedTheme : theme;
  const active = hydrated ? selected : null;
  const index = themes.findIndex((option) => option.value === active);

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
        "bg-fd-secondary/50 relative flex rounded-full p-0.5 text-center *:rounded-full"
      )}
      data-theme-toggle=""
      {...props}
    >
      {index !== -1 && (
        <div
          aria-hidden="true"
          className="bg-fd-foreground/10 pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-7 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${index * STEP}%)` }}
        />
      )}

      {themes.map((option) => (
        <button
          aria-label={option.label}
          aria-pressed={active === option.value}
          className={cn(
            "focus-visible:outline-fd-ring relative inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-sm leading-none transition-colors focus-visible:outline-2",
            active === option.value
              ? "text-fd-foreground"
              : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
          key={option.value}
          onClick={() => change(option.value)}
          type="button"
        >
          <span aria-hidden="true">{option.glyph}</span>
        </button>
      ))}
    </div>
  );
};
