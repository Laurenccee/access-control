'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toggle } from '@/components/ui/toggle';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ga set it theme sa local state ag ga ensure nga ga render lang ang toggle pagkatapos ma mount ang component para malikawan ang hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Toggle
      variant="outline"
      className="group relative"
      pressed={theme === 'dark'}
      disabled={!mounted}
      /* Ga switch between dark and light themes */
      onPressedChange={(pressed) => setTheme(pressed ? 'dark' : 'light')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Toggle>
  );
}
