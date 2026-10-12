import { useThemeStore } from '../store/useThemeStore'

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useThemeStore()
  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }
}

export default useTheme
