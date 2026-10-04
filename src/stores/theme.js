import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // A saved user preference takes priority over the environment default.
  const savedTheme = localStorage.getItem('theme')
  const defaultTheme = import.meta.env.VITE_DEFAULT_THEME === 'dark' ? 'dark' : 'light'
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : defaultTheme
  const isDark = ref(initialTheme === 'dark')

  // Apply theme to document
  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
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
