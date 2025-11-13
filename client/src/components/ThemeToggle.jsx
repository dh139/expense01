
import { useTheme } from "./ThemeProvider"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button className="button secondary" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "Light" : "Dark"} Mode
    </button>
  )
}
