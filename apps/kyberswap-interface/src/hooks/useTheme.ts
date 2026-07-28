import { createContext, useContext } from 'react'

import { Colors } from 'theme/color'

export const ThemeContext = createContext<Colors | undefined>(undefined)

export default function useTheme(): Colors {
  const theme = useContext(ThemeContext)
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return theme
}
