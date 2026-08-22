"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const themes = [
  { name: "Light", value: "light", icon: SunIcon },
  { name: "Dark", value: "dark", icon: MoonIcon },
  { name: "System", value: "system", icon: MonitorIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = themes.find((t) => t.value === theme) ?? themes[2];
  const Icon = current.icon;

  return (
    <Popover>
      <PopoverTrigger className="size-8 rounded-full hover:bg-muted">
        <Icon className="size-4" />
        <span className="sr-only">Toggle theme</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-36 p-1">
        {themes.map((t) => {
          const T = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`
                flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm
                transition-colors hover:bg-muted
                ${theme === t.value ? "bg-muted font-medium" : ""}
              `}
            >
              <T className="size-4" />
              {t.name}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
