import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "./button"
import { useTheme } from "../../contexts/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="h-9 w-9 p-0 bg-muted hover:bg-muted/80 border-border text-foreground hover:text-foreground dark:bg-muted dark:hover:bg-muted/80 dark:border-border dark:text-foreground"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}