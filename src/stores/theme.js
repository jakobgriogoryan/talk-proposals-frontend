import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // A saved user preference takes priority over the environment default.
  let savedTheme
  try { savedTheme = localStorage.getItem('theme') } catch { /* Storage may be blocked by the browser. */ }
  const defaultTheme = import.meta.env.VITE_DEFAULT_THEME === 'dark' ? 'dark' : 'light'
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : defaultTheme
  const isDark = ref(initialTheme === 'dark')

  // Apply theme to document
  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem('theme', isDark.value ? 'dark' : 'light') } catch { /* Theme still works without persistence. */ }
  }

  // Toggle theme
  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
  }

  // Set theme explicitly
  const setTheme = (dark) => {
    isDark.value = dark
    applyTheme()
  }

  // Initialize theme on store creation
  applyTheme()

  return {
    isDark,
    toggleTheme,
    setTheme,
    applyTheme,
  }
})
