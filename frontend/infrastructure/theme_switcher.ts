import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const ThemeSwitcherSchema = z.object({
    defaultTheme: z.enum(['light', 'dark', 'system']).default('system'),
    storageKey: z.string().default('theme'),
    generateToggle: z.boolean().default(true),
});

const handler = async (args: z.infer<typeof ThemeSwitcherSchema>): Promise<SkillResult> => {
    const { defaultTheme, storageKey, generateToggle } = args;
    const files: Record<string, string> = {};

    files['theme-provider.tsx'] = `"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("${defaultTheme}");

  useEffect(() => {
    const stored = localStorage.getItem("${storageKey}") as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem("${storageKey}", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}`;

    if (generateToggle) {
        files['theme-toggle.tsx'] = `"use client";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`;
    }

    return {
        success: true,
        data: files,
        metadata: { defaultTheme, generatedFiles: Object.keys(files) },
    };
};

export const themeSwitcherSkillDefinition: SkillDefinition<typeof ThemeSwitcherSchema> = {
    name: 'theme_switcher',
    description: 'Generates dark/light mode theme provider and toggle component.',
    parameters: ThemeSwitcherSchema,
    handler,
};
